import { requireNativeModule } from 'expo-modules-core';

export type TerminalResult = {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
  cwd: string;
};

type GcodeTerminalNativeModule = {
  execute(
    command: string,
    cwd?: string,
    environment?: Record<string, string>
  ): Promise<TerminalResult>;

  stop(): Promise<boolean>;
};

const GcodeTerminal =
  requireNativeModule<GcodeTerminalNativeModule>('GcodeTerminal');

export async function executeCommand(
  command: string,
  cwd?: string,
  environment?: Record<string, string>
): Promise<TerminalResult> {
  return GcodeTerminal.execute(command, cwd, environment);
}

export async function stopCommand(): Promise<boolean> {
  return GcodeTerminal.stop();
}

export default {
  executeCommand,
  stopCommand,
};
