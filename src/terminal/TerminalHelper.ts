/* eslint-disable @typescript-eslint/naming-convention */
/*
 * @Author: DevMoxi moxiout@gmail.com
 * @Date: 2022-09-05 20:40:18
 * @LastEditTime: 2022-09-18 09:44:48
 */
import * as vscode from "vscode";
import "./TerminalConst";
import * as path from "path";
import { CommandType, TerminalKeys, TerminalState } from "./TerminalConst";
import { getLiteLoaderpath } from "../utils/FileUtils";
import { existsSync, readFile, readFileSync } from "fs";
// import { getBDSCwdPath, getBDSPath } from "../utils/WorkspaceUtil";
export class TerminalHelper {
	static terminal: vscode.Terminal | undefined;
	static context: vscode.ExtensionContext;
	constructor(context: vscode.ExtensionContext) {
		TerminalHelper.context = context;
		this.disposeTerminal();
		context.workspaceState.update(TerminalKeys.STATE, TerminalState.STOPED);
		this.registerCommands();
		vscode.window.onDidCloseTerminal((t) => {
			if (t.name === TerminalKeys.NAME) {
				vscode.commands.executeCommand("setContext", "llse:termianl", false);
				if (t.exitStatus?.code === 0) {
					context.workspaceState.update(
						TerminalKeys.STATE,
						TerminalState.STOPED
					);
				} else {
					context.workspaceState.update(
						TerminalKeys.STATE,
						TerminalState.CRASHED
					);
				}
			}
		});
	}
	registerCommands() {
		function ModName(path: string) {
			let _path = "";
			path.split("\\").forEach((val, index, ary) => {
				if (val === "plugins") { _path = ary[index + 1]; }
			});
			return _path;
		}
		TerminalHelper.context.subscriptions.push(
			vscode.commands.registerCommand("extension.llseaids.runconsole", () => {
				this.runConsole();
			}),
			vscode.commands.registerCommand("extension.llseaids.stopconsole", () => {
				this.stopConsole();
			}),
			vscode.commands.registerCommand("extension.llseaids.load", (uri) => {
				const _path = ModName(uri.fsPath);
				this.managePlugin(CommandType.LOAD, _path);
			}),
			vscode.commands.registerCommand("extension.llseaids.unload", (uri) => {
				const _path = ModName(uri.fsPath);
				this.managePlugin(CommandType.UNLOAD, _path);
			}),
			vscode.commands.registerCommand("extension.llseaids.reload", (uri) => {
				const _path = ModName(uri.fsPath);
				this.managePlugin(CommandType.RELOAD, _path);
			})
		);
	}
	stopConsole() {
		if (TerminalHelper.terminal !== undefined) {
			TerminalHelper.terminal.sendText("stop");
			TerminalHelper.context.workspaceState.update(
				TerminalKeys.STATE,
				TerminalState.STOPED
			);
		} else {
			const no_open_message = localize(
				"terminal.no_open.message",
				"你没有打开过终端！"
			);
			vscode.window.showErrorMessage(no_open_message);
		}
	}
	runConsole() {
		const state = TerminalHelper.context.workspaceState.get(TerminalKeys.STATE);
		switch (state) {
			case TerminalState.OPENED:
				const already_open_message = localize(
					"terminal.already_open.message",
					"你已经打开过一个终端了！"
				);
				const already_open_button = localize(
					"terminal.already_open.button",
					"我知道了"
				);
				vscode.window.showErrorMessage(
					already_open_message,
					already_open_button
				);
				break;
			case TerminalState.CRASHED:
				const crashed_message = localize(
					"terminal.crashed.message",
					"是否重置上一次崩溃的终端"
				);
				const crashed_button_yes = localize(
					"terminal.crashed.button_yes",
					"好"
				);
				const crashed_button_no = localize(
					"terminal.crashed.button_no",
					"不好"
				);
				vscode.window
					.showWarningMessage(
						crashed_message,
						crashed_button_yes,
						crashed_button_no
					)
					.then((value) => {
						if (value === crashed_button_yes) {
							this.disposeTerminal();
						}
						this.createTerminal();
					});

				break;
			case TerminalState.STOPED:
				this.createTerminal();
			default:
				break;
		}
	}
	createTerminal() {
		try {
			const cwdPath = getLiteLoaderpath();
			let t = vscode.window.createTerminal({
				name: TerminalKeys.NAME,
				shellPath: cwdPath + "\\bedrock_server_mod.exe",
				cwd: cwdPath,
			});
			t.show();
			TerminalHelper.terminal = t;
			TerminalHelper.context.workspaceState.update(
				TerminalKeys.STATE,
				TerminalState.OPENED
			);
			vscode.commands.executeCommand("setContext", "llse:termianl", true);
		} catch (err) {
			vscode.window.showErrorMessage("" + err);
		}
	}
	managePlugin(type: CommandType, ModName: string) {
		const state = TerminalHelper.context.workspaceState.get(TerminalKeys.STATE);
		if (
			TerminalHelper.terminal !== undefined &&
			state === TerminalState.OPENED
		) {
			switch (type) {
				case CommandType.LOAD:
					const command_load = vscode.workspace
						.getConfiguration("extension.llseaids")
						.get("loadCommand") as string;
					TerminalHelper.terminal.sendText(
						command_load.replace("{ModName}", ModName)
					);
					break;
				case CommandType.UNLOAD:
					const command_unload = vscode.workspace
						.getConfiguration("extension.llseaids")
						.get("unloadCommand") as string;
					TerminalHelper.terminal.sendText(
						command_unload.replace("{ModName}", ModName)
					);
					break;
				case CommandType.RELOAD:
					const command_reload = vscode.workspace
						.getConfiguration("extension.llseaids")
						.get("reloadCommand") as string;
					TerminalHelper.terminal.sendText(
						command_reload.replace("{ModName}", ModName)
					);
					break;
				default:
					break;
			}
		} else {
			const no_open_message = localize(
				"terminal.no_open.message",
				"你没有打开过终端！"
			);
			vscode.window.showWarningMessage(no_open_message);
		}
	}
	disposeTerminal() {
		vscode.commands.executeCommand("setContext", "llse:termianl", false);
		TerminalHelper.terminal = undefined;
		vscode.window.terminals.forEach((terminal) => {
			if (terminal.name === TerminalKeys.NAME) {
				terminal.dispose();
			}
		});
	}
}

function localize(str: string, str2: string) {
	return str2;
}
