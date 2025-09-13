"use client";

import { useEffect, useState } from "react";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-stark/useScaffoldWatchContractEvent";

type CounterChangeReason =
  | { variant: "Increase"; value: any }
  | { variant: "Decrease"; value: any }
  | { variant: "Reset"; value: any }
  | { variant: "Set"; value: any };

interface CounterEvent {
  caller: string;
  oldValue: bigint;
  newValue: bigint;
  reason: CounterChangeReason;
}

// parse helpers
function parseCairoEnum<T extends Record<string, any> | undefined>(
  enumObj: T
): { variant: keyof NonNullable<T>; value: any } | null {
  if (!enumObj) return null;
  for (const [key, val] of Object.entries(enumObj)) {
    if (val !== undefined && val !== null) {
      return { variant: key as keyof NonNullable<T>, value: val };
    }
  }
  return null;
}

function parseNestedCairoEnum(eventArgs: any): CounterChangeReason | null {
  const possiblePaths = [
    eventArgs?.reason,
    eventArgs?.variant,
    eventArgs?.change_reason,
    eventArgs?.changeReason,
  ];
  for (const path of possiblePaths) {
    if (path) {
      const parsed = parseCairoEnum(path);
      if (parsed) return parsed as CounterChangeReason;
    }
  }
  return null;
}

const safeStringify = (v: any) => {
  if (v === undefined || v === null) return "";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "object") {
    try {
      return JSON.stringify(v, (_, x) =>
        typeof x === "bigint" ? x.toString() : x
      );
    } catch {
      return String(v);
    }
  }
  return String(v);
};

export const CounterContractEvents = () => {
  const [events, setEvents] = useState<CounterEvent[]>([]);

  // 1. Fetch event history once
  const { data, isLoading, error } = useScaffoldEventHistory({
    contractName: "CounterContract",
    eventName: "CounterChanged",
    fromBlock: BigInt(2026708),
    filters: {},
    blockData: true,
    watch: false,
    enabled: true,
  });  console.log("Fetched event history:", data);


  // 2. Watch new events (live updates)
  useScaffoldWatchContractEvent({
    contractName: "CounterContract",
    eventName: "CounterChanged",
    onLogs: (log) => {
      if (!log) return;
      const args = log.parsedArgs ?? log.args;
      const event: CounterEvent = {
        caller: args?.caller ?? "",
        oldValue: BigInt(args?.old_value ?? args?.oldValue ?? 0),
        newValue: BigInt(args?.new_value ?? args?.newValue ?? 0),
        reason: parseNestedCairoEnum(args) ?? { variant: "Set", value: {} },
      };
      console.log("📡 CounterChanged event", event);
      setEvents((prev) => [...prev, event]); // append to history
    },
  });

  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div>Error loading events: {String(error)}</div>;

  const KNOWN_VARIANTS = ["Increase", "Decrease", "Reset", "Set"] as const;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-bold">Contract Events</h2>
      {events.length === 0 ? (
        <p>No events yet...</p>
      ) : (
        events.map((ev, i) => {
          const reasonVal = ev.reason?.value;
          let activeVariants: string[] = [];
          if (reasonVal && typeof reasonVal === "object") {
            activeVariants = Object.entries(reasonVal)
              .filter(([_, v]) => v !== undefined && v !== null)
              .map(([k]) => k);
          } else if (ev.reason?.variant) {
            activeVariants = [String(ev.reason.variant)];
          }

          return (
            <div key={i} className="p-3 border rounded-lg shadow-sm">
              <p>
                <b>Caller:</b> {ev.caller}
              </p>
              <p>
                <b>Old Value:</b> {ev.oldValue.toString()}
              </p>
              <p>
                <b>New Value:</b> {ev.newValue.toString()}
              </p>

              <div className="flex flex-col gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">variant</span>
                </div>

                <div className="ml-4 mt-1 text-sm text-gray-700">
                  {KNOWN_VARIANTS.map((variantName) => {
                    const isActive = activeVariants.includes(variantName);
                    const value =
                      reasonVal && typeof reasonVal === "object"
                        ? reasonVal[variantName]
                        : undefined;

                    const isObject =
                      typeof value === "object" && value !== null;
                    const isNonEmptyObject =
                      isObject && Object.keys(value).length > 0;

                    const showValue =
                      value !== undefined &&
                      value !== null &&
                      (!isObject || isNonEmptyObject);

                    return (
                      <div
                        key={variantName}
                        className="flex items-center gap-2 leading-5"
                      >
                        <span className="font-medium">{variantName}</span>
                        {isActive && (
                          <span className="text-green-600 font-medium">✔️</span>
                        )}
                        {showValue && (
                          <span className="ml-2 text-gray-500">
                            ({safeStringify(value)})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
