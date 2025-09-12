import Link from "next/link";
import Image from "next/image";
import { ConnectedAddress } from "~~/components/ConnectedAddress";
import { CounterValue } from "~~/components/CounterValue";
import { CounterContractEvents } from "~~/components/CounterContractEvents";

const Home = () => {
  return (
    <div className="flex items-center flex-col grow pt-10">
     <CounterValue/>
 
    </div>
  );
};

export default Home;
