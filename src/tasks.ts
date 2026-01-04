// PMTK2 - A modern Proxmox Monitoring Toolkit
// Copyright (C) 2026 Logan Devine <logan@zirco.dev>
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

import { getSecondEpoch } from "./util.js";
import { Proxmox } from "proxmox-api";

// we just started, so track since initialization
let lastTaskCheck = getSecondEpoch();

export async function getFailingTasksSinceLastCheck(
    pve: Proxmox.Api,
    node: string
): Promise<Proxmox.nodesTasksNodeTasks[]> {
    let allTasks = await pve.nodes.$(node).tasks.$get({});

    let filteredTasks = allTasks.filter((task) => {
        return (task.endtime ?? 0) >= lastTaskCheck && task.status !== "OK";
    });

    // update last check time
    lastTaskCheck = getSecondEpoch();

    return filteredTasks;
}
