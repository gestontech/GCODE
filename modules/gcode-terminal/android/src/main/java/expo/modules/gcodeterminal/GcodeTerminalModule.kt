package expo.modules.gcodeterminal

import android.net.Uri
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.concurrent.Executors

class GcodeTerminalModule : Module() {

    private val executor =
        Executors.newCachedThreadPool()

    @Volatile
    private var currentProcess: Process? = null

    private fun resolveWorkingDirectory(
        cwd: String?
    ): File {
        if (cwd.isNullOrBlank()) {
            return (
                appContext.reactContext?.filesDir
                    ?: File(".")
            )
        }

        val value = cwd.trim()

        return if (
            value.startsWith("file://")
        ) {
            val parsed =
                Uri.parse(value)

            val path =
                parsed.path

            if (!path.isNullOrBlank()) {
                File(path)
            } else {
                File(
                    value.removePrefix(
                        "file://"
                    )
                )
            }
        } else {
            File(value)
        }
    }

    private fun buildEnvironment(
        environment: Map<String, String>?
    ): Map<String, String> {
        val result =
            HashMap<String, String>()

        result.putAll(
            System.getenv()
        )

        if (environment != null) {
            result.putAll(
                environment
            )
        }

        return result
    }

    override fun definition() =
        ModuleDefinition {

            Name("GcodeTerminal")

            AsyncFunction("execute") {
                command: String,
                cwd: String?,
                environment: Map<String, String>?,
                promise: Promise
                ->

                executor.execute {

                    var process: Process? =
                        null

                    try {

                        if (
                            command.isBlank()
                        ) {
                            promise.reject(
                                "EMPTY_COMMAND",
                                "La commande est vide.",
                                null
                            )

                            return@execute
                        }

                        val workingDirectory =
                            resolveWorkingDirectory(
                                cwd
                            )

                        if (
                            !workingDirectory.exists()
                        ) {
                            promise.reject(
                                "INVALID_CWD",
                                "Le dossier courant n'existe pas : ${workingDirectory.absolutePath}",
                                null
                            )

                            return@execute
                        }

                        if (
                            !workingDirectory.isDirectory
                        ) {
                            promise.reject(
                                "INVALID_CWD",
                                "Le chemin courant n'est pas un dossier : ${workingDirectory.absolutePath}",
                                null
                            )

                            return@execute
                        }

                        val shell =
                            if (
                                File(
                                    "/system/bin/sh"
                                ).exists()
                            ) {
                                "/system/bin/sh"
                            } else {
                                "sh"
                            }

                        val processBuilder =
                            ProcessBuilder(
                                shell,
                                "-c",
                                command
                            )

                        processBuilder.directory(
                            workingDirectory
                        )

                        processBuilder.redirectErrorStream(
                            false
                        )

                        val processEnvironment =
                            processBuilder.environment()

                        processEnvironment.clear()

                        processEnvironment.putAll(
                            buildEnvironment(
                                environment
                            )
                        )

                        /*
                         * Variables GCODE utiles
                         * au projet.
                         */
                        processEnvironment[
                            "GCODE_CWD"
                        ] =
                            workingDirectory
                                .absolutePath

                        val processInstance =
                            processBuilder.start()

                        process =
                            processInstance

                        currentProcess =
                            processInstance

                        val stdoutBuilder =
                            StringBuilder()

                        val stderrBuilder =
                            StringBuilder()

                        val stdoutThread =
                            Thread {

                                try {

                                    processInstance
                                        .inputStream
                                        .bufferedReader()
                                        .useLines { lines ->

                                            lines.forEach { line ->

                                                stdoutBuilder
                                                    .append(line)
                                                    .append('\n')
                                            }
                                        }

                                } catch (_: Exception) {
                                    // Le processus peut
                                    // fermer stdout
                                    // pendant son arrêt.
                                }
                            }

                        val stderrThread =
                            Thread {

                                try {

                                    processInstance
                                        .errorStream
                                        .bufferedReader()
                                        .useLines { lines ->

                                            lines.forEach { line ->

                                                stderrBuilder
                                                    .append(line)
                                                    .append('\n')
                                            }
                                        }

                                } catch (_: Exception) {
                                    // Le processus peut
                                    // fermer stderr
                                    // pendant son arrêt.
                                }
                            }

                        stdoutThread.start()
                        stderrThread.start()

                        val exitCode =
                            processInstance.waitFor()

                        stdoutThread.join()
                        stderrThread.join()

                        val stdout =
                            stdoutBuilder.toString()

                        val stderr =
                            stderrBuilder.toString()

                        currentProcess =
                            null

                        promise.resolve(
                            mapOf(
                                "command" to command,
                                "stdout" to stdout,
                                "stderr" to stderr,
                                "exitCode" to exitCode,
                                "success" to (
                                    exitCode == 0
                                ),
                                "cwd" to
                                    workingDirectory
                                        .absolutePath
                            )
                        )

                    } catch (
                        error: Exception
                    ) {

                        currentProcess =
                            null

                        val message =
                            error.message
                                ?: error
                                    .javaClass
                                    .simpleName

                        promise.resolve(
                            mapOf(
                                "command" to command,
                                "stdout" to "",
                                "stderr" to message,
                                "exitCode" to -1,
                                "success" to false,
                                "cwd" to (
                                    try {
                                        resolveWorkingDirectory(
                                            cwd
                                        ).absolutePath
                                    } catch (_: Exception) {
                                        ""
                                    }
                                )
                            )
                        )

                    } finally {

                        if (
                            process != null &&
                            !process.isAlive
                        ) {
                            currentProcess =
                                null
                        }
                    }
                }
            }

            AsyncFunction("stop") {

                val process =
                    currentProcess
                        ?: return@AsyncFunction false

                return@AsyncFunction try {

                    process.destroy()

                    /*
                     * Laisse au processus
                     * un court délai pour
                     * terminer proprement.
                     */
                    Thread.sleep(100)

                    if (
                        process.isAlive
                    ) {
                        process.destroyForcibly()
                    }

                    currentProcess =
                        null

                    true

                } catch (_: Exception) {

                    currentProcess =
                        null

                    false
                }
            }
        }
}
