"use client";

import { useState, useEffect } from "react";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import { CounterContractEvents } from "./CounterContractEvents";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldContract } from "~~/hooks/scaffold-stark/useScaffoldContract";

export const CounterValue = () => {
  const [counterValue, setCounterValue] = useState(0);
  const [inputValue, setInputValue] = useState(""); // local input state
 /*  const { data: counterContract } = useScaffoldContract({
    contractName: "CounterContract",
  }); */
  const counterContractAddress ="0x387992af20db1417c3c7fd88c56ad437b1f267d939d8bf0f2ed0fd593ed0a14"

  // Read the current counter value
  const { data: value } = useScaffoldReadContract({
    contractName: "CounterContract",
    functionName: "get_counter",
    args: [],
  });

  useEffect(() => {
    if (value !== undefined) {
      setCounterValue(Number(value));
    }
  }, [value]);

  // contract writes
  const { sendAsync: increaseCounter } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "increase_counter",
    args: [],
  });

  const { sendAsync: decreaseCounter } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "decrease_counter",
    args: [],
  });

  const { sendAsync: setCounter } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "set_counter",
    args: [inputValue ? Number(inputValue) : 0],
  });

  const { sendAsync: resetCounter } = useScaffoldMultiWriteContract({
    calls: [
      {
        contractName: "Strk",
        functionName: "approve",
        args: [counterContractAddress, 10000000000000000000n],
      },
      {
        contractName: "CounterContract",
        functionName: "reset_counter",
        args: [],
      },
    ],
  });

  // handlers
  const handleIncrease = async () => {
    try {
      await increaseCounter();
      console.log("Counter increased!");
    } catch (error) {
      console.error("Increase transaction failed:", error);
    }
  };

  const handleDecrease = async () => {
    try {
      await decreaseCounter();
      console.log("Counter decreased!");
    } catch (error) {
      console.error("Decrease transaction failed:", error);
    }
  };

  const handleSetCounter = async () => {
    try {
      await setCounter();
      console.log("Counter set!");
    } catch (error) {
      console.error("Set counter transaction failed:", error);
    }
  };

  const handleResetCounter = async () => {
    try {
      await resetCounter();
      console.log("Counter reset!");
    } catch (error) {
      console.error("Reset counter transaction failed:", error);
    }
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="bg-base-300 rounded-lg p-8 mb-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-4">Counter</h2>

        <div className="text-6xl font-bold text-center mb-6 text-primary">
          {counterValue}
        </div>

        {/* Row 1: Increase / Decrease */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            className="px-4 py-2 rounded-lg font-semibold shadow 
              bg-green-500 hover:bg-green-600 text-white 
              dark:bg-green-400 dark:hover:bg-green-500"
            onClick={handleIncrease}
          >
            Increase
          </button>

          <button
            className={`px-4 py-2 rounded-lg font-semibold shadow 
              ${
                counterValue === 0
                  ? "bg-gray-400 text-gray-100 cursor-not-allowed dark:bg-gray-600"
                  : "bg-red-500 hover:bg-red-600 text-white dark:bg-red-400 dark:hover:bg-red-500"
              }`}
            onClick={handleDecrease}
            disabled={counterValue === 0}
          >
            Decrease
          </button>
        </div>

        {/* Row 2: Set / Reset */}
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Set with input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input input-bordered w-28 text-center dark:bg-gray-800 dark:text-white"
              placeholder="Set value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              className={`px-4 py-2 rounded-lg font-semibold shadow 
                ${
                  inputValue === ""
                    ? "bg-gray-400 text-gray-100 cursor-not-allowed dark:bg-gray-600"
                    : "bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-400 dark:hover:bg-blue-500"
                }`}
              onClick={handleSetCounter}
              disabled={inputValue === ""}
            >
              Set
            </button>
          </div>

          {/* Reset */}
          <button
            className={`px-4 py-2 rounded-lg font-semibold shadow 
              ${
                counterValue === 0
                  ? "bg-gray-400 text-gray-100 cursor-not-allowed dark:bg-gray-600"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-400 dark:hover:bg-yellow-500"
              }`}
            onClick={handleResetCounter}
            disabled={counterValue === 0}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
