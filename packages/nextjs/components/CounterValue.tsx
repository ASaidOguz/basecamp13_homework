"use client";

import { useState, useEffect } from "react";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import { CounterContractEvents } from "./CounterContractEvents";
import deployedContracts from "~~/contracts/deployedContracts";

export const CounterValue = () => {
  const [counterValue, setCounterValue] = useState(0);
  const [inputValue, setInputValue] = useState(""); // local input state

  // Read the current counter value
  const { data: value } = useScaffoldReadContract({
    contractName: "CounterContract",
    functionName: "get_counter",
    args: [],
  });

  // Update local state when blockchain value changes
  useEffect(() => {
    if (value !== undefined) {
      setCounterValue(Number(value));
    }
  }, [value]);

  // Write contract for increasing
  const { sendAsync: increaseCounter } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "increase_counter",
    args: [],
  });

  // Write contract for decreasing
  const { sendAsync: decreaseCounter } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "decrease_counter",
    args: [],
  });

  // Write contract for setting
  const { sendAsync: setCounter } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "set_counter",
    args: [inputValue ? Number(inputValue) : 0], // <-- use input as argument
  });

   // Write contract for reset
  const { sendAsync:resetCounter } = useScaffoldMultiWriteContract({
  calls: [
     {
       contractName: "Strk",
       functionName: "approve",
       args: [deployedContracts.devnet.CounterContract.address,10000000000000000000n],
     },
     {
       contractName: "CounterContract",
       functionName: "reset_counter",
       args: [],
     },
   ],
  });
  // handles increase action,
  const handleIncrease = async () => {
    try {
      await increaseCounter();
      console.log("Counter increased!");
    } catch (error) {
      console.error("Increase transaction failed:", error);
    }
  };
  // handles decrease action,
  const handleDecrease = async () => {
    try {
      await decreaseCounter();
      console.log("Counter decreased!");
    } catch (error) {
      console.error("Decrease transaction failed:", error);
    }
  };
  // handles set action,
  const handleSetCounter = async () => {
    try {
      await setCounter();
      console.log("Counter set!");
    } catch (error) {
      console.error("Set counter transaction failed:", error);
    }
  };

  // handles reset action,
  const handleResetCounter = async () => {
    try {
      await resetCounter();
      console.log("Counter reset!");
    } catch (error) {
      console.error("Reset counter transaction failed:", error);
    }
  }

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="bg-base-300 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-center mb-4">Counter</h2>
        <div className="text-6xl font-bold text-center mb-6 text-primary">
          {counterValue}
        </div>
        
        <div className="flex gap-4 justify-center mb-4">
          <button 
            className={`btn btn-lg ${counterValue === 0 ? 'btn-disabled' : 'btn-secondary'}`}
            onClick={handleDecrease}
            disabled={counterValue === 0}
          >
            -
          </button>
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleIncrease}
          >
            +
          </button>
        </div>

        {/* Input + Set Button */}
        <div className="flex gap-2 justify-center">
          <input
            type="number"
            className="input input-bordered w-32 text-center"
            placeholder="Set value"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            className="btn btn-accent"
            onClick={handleSetCounter}
            disabled={inputValue === ""}
          >
            Set
          </button>
        </div>
        <div className="flex gap-4 justify-center mt-4"></div>
          <button 
            className="btn btn-warning btn-lg"
            onClick={handleResetCounter}
            disabled={counterValue === 0}
          >
            Reset
          </button>
      </div>
        <CounterContractEvents/>
    </div>
  );
};
