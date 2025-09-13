import Link from "next/link";
import Image from "next/image";
import { ConnectedAddress } from "~~/components/ConnectedAddress";
import { CounterValue } from "~~/components/CounterValue";
import { CounterContractEvents } from "~~/components/CounterContractEvents";

const Home = () => {
  return (
    <div className="flex flex-row grow pt-10 gap-6 px-6">
      <div className="w-1/2">
        <CounterValue />
      </div>
      <div className="w-1/2">
        <CounterContractEvents />
      </div>
    </div>
  );
};

export default Home;

