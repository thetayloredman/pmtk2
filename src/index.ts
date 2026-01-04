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

const pve = pveClient({ ...globalConfig.proxmox });

let originalState = await getCurrentState(pve);
sendAlerts(
    ":white_check_mark: PMTK2 has started and is monitoring the Proxmox cluster."
);

setInterval(async () => {
    const newState = await getCurrentState(pve);

    for (const node of mergeKeys(originalState, newState)) {
        let originalNodeState = originalState[node] || null;
        let newNodeState = newState[node] || null;

        if (originalNodeState === null) {
            sendAlerts(
                `:pregnant_woman: A new node (${node}) has been added to the cluster.`
            );
            originalNodeState = {};
        }

        if (newNodeState === null) {
            sendAlerts(
                `:fire: Node ${node} has been removed from the cluster.`
            );
            newNodeState = {};
        }

        for (const vmid of mergeKeys(originalNodeState, newNodeState)) {
            const originalVMState = originalNodeState[vmid] || null;
            const newVMState = newNodeState[vmid] || null;

            if (originalVMState === null) {
                sendAlerts(
                    `:baby: Guest ${guestType(newVMState.type)} ${vmid} (${
                        newVMState.name
                    }) has been created on node ${node} and is currently ${
                        newVMState.status
                    }.`
                );
                continue;
            }

            if (newVMState === null) {
                sendAlerts(
                    `:skull: Guest ${guestType(
                        originalVMState.type
                    )} ${vmid} (${
                        originalVMState.name
                    }) has been deleted from node ${node}.`
                );
                continue;
            }

            if (originalVMState.status !== newVMState.status) {
                if (
                    newVMState.status === "running" &&
                    originalVMState.status === "stopped"
                ) {
                    sendAlerts(
                        `:rocket: Guest ${guestType(
                            newVMState.type
                        )} ${vmid} (${
                            newVMState.name
                        }) on node ${node} has started.`
                    );
                } else if (
                    newVMState.status === "stopped" &&
                    originalVMState.status === "running"
                ) {
                    sendAlerts(
                        `:octagonal_sign: Guest ${guestType(
                            newVMState.type
                        )} ${vmid} (${
                            newVMState.name
                        }) on node ${node} has stopped.`
                    );
                } else if (
                    newVMState.status === "running" &&
                    originalVMState.status === "running" &&
                    newVMState.uptime < originalVMState.uptime
                ) {
                    sendAlerts(
                        `:arrows_counterclockwise: Guest ${guestType(
                            newVMState.type
                        )} ${vmid} (${
                            newVMState.name
                        }) on node ${node} has been restarted.`
                    );
                } else {
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
            }
        }
    }

    originalState = newState;
}, globalConfig.checkRateMs);
