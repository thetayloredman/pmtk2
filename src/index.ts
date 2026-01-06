// PMTK2 - A modern Proxmox Monitoring Toolkit
// Copyright (C) 2026 Logan Devine <logan@zirco.dev>
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import pveClient from "proxmox-api";
import sendAlerts from "./alerting.js";
import { globalConfig } from "./config.js";
import { getCurrentState } from "./state.js";
import { mergeKeys, guestType } from "./util.js";
import { getFailingTasksSinceLastCheck } from "./tasks.js";
import { checkForAptUpdates } from "./apt.js";

const pve = pveClient({ ...globalConfig.proxmox });

console.log("Fetching initial state and starting monitoring loop...");
let originalState = await getCurrentState(pve);
sendAlerts(
    ":white_check_mark: PMTK2 has started and is monitoring the Proxmox cluster."
);

console.log(
    `Will check for state changes every ${globalConfig.checkRateMs}ms.`
);
setInterval(async () => {
    try {
    console.log("Checking for state changes...");
    const newState = await getCurrentState(pve);

    for (const node of mergeKeys(originalState, newState)) {
        let originalNodeState = originalState[node] || null;
        let newNodeState = newState[node] || null;

        if (originalNodeState === null) {
            console.log(`Discovered new node ${node}.`);
            sendAlerts(
                `:pregnant_woman: A new node (${node}) has been added to the cluster.`
            );
            originalNodeState = {};
        }

        if (newNodeState === null) {
            console.log(`Node ${node} disappeared.`);
            sendAlerts(
                `:fire: Node ${node} has been removed from the cluster.`
            );
            newNodeState = {};
        }

        for (const vmid of mergeKeys(originalNodeState, newNodeState)) {
            const originalVMState = originalNodeState[vmid] || null;
            const newVMState = newNodeState[vmid] || null;

            const type = guestType(originalVMState?.type ?? newVMState?.type);
            const name = newVMState?.name ?? originalVMState?.name ?? "unknown";

            const statusChange = `${originalVMState?.status ?? null} -> ${
                newVMState?.status ?? null
            }`;

            if (originalVMState.lock === "backup" || newVMState.lock === "backup") {
                console.log(
                    "Skipped VM",
                    vmid,
                    "because it is currently being backed up."
                );
                continue;
            }

            console.log(`-> For ${type} ${vmid} (${name}): ${statusChange}`);

            switch (statusChange) {
                case "null -> running":
                    sendAlerts(
                        `:baby: Guest ${type} ${vmid} (${name}) on node ${node} was created and started.`
                    );
                    break;

                case "null -> stopped":
                    sendAlerts(
                        `:baby: Guest ${type} ${vmid} (${name}) on node ${node} was created and is currently stopped.`
                    );
                    break;

                case "running -> null":
                case "stopped -> null":
                    sendAlerts(
                        `:skull_and_crossbones: Guest ${type} ${vmid} (${name}) on node ${node} has been deleted.`
                    );
                    break;

                case "stopped -> running":
                    sendAlerts(
                        `:rocket: Guest ${type} ${vmid} (${name}) on node ${node} has started.`
                    );
                    break;
                case "running -> stopped":
                    sendAlerts(
                        `:octagonal_sign: Guest ${guestType(
                            newVMState.type
                        )} ${vmid} (${
                            newVMState.name
                        }) on node ${node} has stopped.`
                    );
                    break;
                case "running -> running":
                    if (newVMState.uptime < originalVMState.uptime) {
                        console.log(
                            "-> Detected a restart based on uptime decrease."
                        );
                        sendAlerts(
                            `:arrows_counterclockwise: Guest ${guestType(
                                newVMState.type
                            )} ${vmid} (${
                                newVMState.name
                            }) on node ${node} has been restarted.`
                        );
                    }
                    break;
                default:
                    if (originalVMState.status !== newVMState.status) {
                        console.error(
                            `-> Detected an unknown state change ${statusChange}.`
                        );
                        sendAlerts(
                            `:warning: Guest ${guestType(
                                newVMState.type
                            )} ${vmid} (${
                                newVMState.name
                            }) on node ${node} made an unknown state change from ${
                                originalVMState.status
                            } to ${newVMState.status}.`
                        );
                    }
                    break;
            }
        }

        let recentlyFailedTasks = await getFailingTasksSinceLastCheck(
            pve,
            node
        );

        for (const task of recentlyFailedTasks) {
            console.log("-> Detected failed task:", task);
            sendAlerts(
                `:warning: A task on node ${node} has failed.\n` +
                    `- UPID: ${task.upid}\n` +
                    `- VMID: ${task.vmid ?? "N/A"}\n` +
                    `- Type: ${task.type}\n` +
                    `- Start Time: ${new Date(
                        (task.starttime ?? 0) * 1000
                    ).toLocaleString()}\n` +
                    `- End Time: ${new Date(
                        (task.endtime ?? 0) * 1000
                    ).toLocaleString()}\n` +
                    `- Status: ${task.status}`
            );
        }
    }

    originalState = newState;
    } catch (e) {
        sendAlerts(':error: An error occurred while checking for state changes:\n' + (e as any).toString());
    }
}, globalConfig.checkRateMs);

setInterval(checkForAptUpdates, globalConfig.aptMonitoring.checkRateMs, pve);
