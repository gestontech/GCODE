package expo.modules.gcodeterminal

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.concurrent.Executors

class GcodeTerminalModule : Module() {

    private val executor = Executors.newCachedThreadPool()

    @Volatile
    private var currentProcess: Process? = null

    override fun definition() = ModuleDefinition {
        Name("GcodeTerminal")

        AsyncFunction("execute") { 
            command: String,
            cwd: String?,
            environment: Map<String, String>?,
            promise: Promise
        ->
            executor.execute {
                try {
                    if (command.isBlank()) {
                        promise.reject(
                            "EMPTY_COMMAND",
                            "La commande est vide.",
                            null
                        )
                        return@execute
                    }

                    val workingDirectory = if (!cwd.isNullOrBlank()) {
                        File(cwd)
                    } else {
                        File(
                            appContext.reactContext?.filesDir
                                ?: File(".")
                        )
                    }

                    if (!workingDirectory.exists()) {
                        promise.reject(
                            "INVALID_CWD",
                            "Le dossier courant n'existe pas : ${workingDirectory.absolutePath}",
                            null
                        )
                        return@execute
                    }

                    if (!workingDirectory.isDirectory) {
                        promise.reject(
                            "INVALID_CWD",
                            "Le chemin courant n'est pas un dossier : ${workingDirectory.absolutePath}",
                            null
                        )
                        return@execute
                    }

                    val shell = if (File("/system/bin/sh").exists()) {
                        "/system/bin/sh"
                    } else {
                        "sh"
                    }

                    val processBuilder = ProcessBuilder(
                        shell,
                        "-c",
                        command
                    )

                    processBuilder.directory(workingDirectory)
                    processBuilder.redirectErrorStream(false)

                    val processEnvironment = processBuilder.environment()

                    if (environment != null) {
                        for ((key, value) in environment) {
                            processEnvironment[key] = value
                        }
                    }

                    val process = processBuilder.start()

                    currentProcess = process

                    val stdoutBuilder = StringBuilder()
                    val stderrBuilder = StringBuilder()

                    val stdoutThread = Thread {
                        try {
                            process.inputStream
                                .bufferedReader()
                                .useLines { lines ->
                                    lines.forEach { line ->
                                        stdoutBuilder
                                            .append(line)
                                            .append('\n')
                                    }
                                }
                        } catch (_: Exception) {
                        }
                    }

                    val stderrThread = Thread {
                        try {
                            process.errorStream
                                .bufferedReader()
                                .useLines { lines ->
                                    lines.forEach { line ->
                                        stderrBuilder
                                            .append(line)
                                            .append('\n')
                                    }
                                }
                        } catch (_: Exception) {
                        }
                    }

                    stdoutThread.start()
                    stderrThread.start()

                    val exitCode = process.waitFor()

                    stdoutThread.join()
                    stderrThread.join()

                    currentProcess = null

                    promise.resolve(
                        mapOf(
                            "command" to command,
                            "stdout" to stdoutBuilder.toString(),
                            "stderr" to stderrBuilder.toString(),
                            "exitCode" to exitCode,
                            "success" to (exitCode == 0),
                            "cwd" to workingDirectory.absolutePath
                        )
                    )

                } catch (error: Exception) {
                    currentProcess = null

                    promise.resolve(
                        mapOf(
                            "command" to command,
                            "stdout" to "",
                            "stderr" to (
                                error.message
                                    ?: error.javaClass.simpleName
                            ),
                            "exitCode" to -1,
                            "success" to false,
                            "cwd" to (
                                cwd
                                    ?: appContext.reactContext?.filesDir?.absolutePath
                                    ?: ""
                            )
                        )
                    )
                }
            }
        }

        AsyncFunction("stop") {
            currentProcess?.let { process ->
                try {
                    process.destroy()

                    if (process.isAlive) {
                        process.destroyForcibly()
                    }

                    currentProcess = null
                    true
                } catch (_: Exception) {
                    false
                }
            } ?: false
        }
    }
}
