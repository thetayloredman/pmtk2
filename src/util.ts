// PMTK2 - A modern Proxmox Monitoring Toolkit
// Copyright (C) 2026 Logan Devine <logan@zirco.dev>
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0

export function mergeKeys(
    a: Record<string, any>,
    b: Record<string, any>
): string[] {
    const keys = new Set<string>();
    for (const key of Object.keys(a)) {
        keys.add(key);
    }
    for (const key of Object.keys(b)) {
        keys.add(key);
    }
    return Array.from(keys);
}

export function guestType(type: "qemu" | "lxc"): "CT" | "VM" {
    return type === "lxc" ? "CT" : "VM";
}
