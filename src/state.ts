// PMTK2 - A modern Proxmox Monitoring Toolkit
// Copyright (C) 2026 Logan Devine <logan@zirco.dev>
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import { Proxmox } from "proxmox-api";

export type VmType = "lxc" | "qemu";
export type Status = "running" | "stopped";
export type VmState = {
    name: string;
    type: VmType;
    status: Status;
    lock: string | null;
    uptime: number;
};
export type NodeState = Record<string, VmState>;
export type State = Record<string, NodeState>;

export async function getCurrentState(pve: Proxmox.Api): Promise<State> {
    console.debug("-> Fetching current state from Proxmox API...");
    const state: State = {};

    for (const { node: nodeName } of await pve.nodes.$get()) {
        const nodeState: NodeState = {};
        const node = pve.nodes.$(nodeName);

        for (const lxc of await node.lxc.$get()) {
            nodeState[lxc.vmid] = {
                name: lxc.name!,
                type: "lxc",
                status: lxc.status as Status,
                lock: lxc.lock || null,
                uptime: lxc.uptime!,
            };
        }

        for (const qemu of await node.qemu.$get()) {
            nodeState[qemu.vmid] = {
                name: qemu.name!,
                type: "qemu",
                status: qemu.status as Status,
                lock: qemu.lock || null,
                uptime: qemu.uptime!,
            };
        }

        state[nodeName] = nodeState;
    }

    return state;
}
