
use snforge_std::EventSpyAssertionsTrait;
use snforge_std::stop_cheat_caller_address;
use snforge_std::DeclareResultTrait;
use snforge_std::{declare,ContractClassTrait,spy_events,start_cheat_caller_address,set_balance,Token};
use starknet::ContractAddress;
// entrance into CounterContract -> Make module public in lib.cairo file.
// for dispatchers and traits -> Make interface public in CounterContract.cairo file.
use contracts::CounterContract::{ICounterDispatcher,ICounterDispatcherTrait};
// we import the event(enum) and event struct and then another enum which resides inside the event struct.
// need to be set as public even inside struct fields to be used.
use contracts::CounterContract::CounterContract::{CounterChanged,ChangeReason,Event};
use contracts::Utils::{stark_address,strk_to_fri};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher,IERC20DispatcherTrait};
fn owner_address() -> ContractAddress{
   'owner'.try_into().unwrap()
}
fn non_owner_address() -> ContractAddress{
   'nowner'.try_into().unwrap()
}

fn deploy_counter(init_value:u32) -> ICounterDispatcher{
   let contract = declare("CounterContract").unwrap().contract_class();
   // predefine arrays type to remove the error.
   let mut constructor_args:Array<felt252> = array![];
   // every primitve type has serialize trait. 
   let owner_address:ContractAddress = owner_address();
   init_value.serialize(ref constructor_args);
   owner_address.serialize(ref constructor_args);

   let (contract_address,_) = contract.deploy(@constructor_args).unwrap();
   // same named variables can be passed as solo argument -> compiler smort ^>^.
   ICounterDispatcher{contract_address}
}
#[test]
fn test_contract_initialization(){
   let init_value:u32 = 5 ;
   let counter_dispatcher = deploy_counter(init_value);
    let current_counter = counter_dispatcher.get_counter();
    let expected_counter :u32 = 5 ;
      assert!(current_counter==expected_counter,"Initialization of counter failed");
}
#[test]
fn test_increment_counter(){
   let init_counter:u32=0;
   let counter_dispatcher = deploy_counter(init_counter); 
   let mut spy = spy_events();

   start_cheat_caller_address(counter_dispatcher.contract_address, owner_address());
   counter_dispatcher.increase_counter();
   stop_cheat_caller_address(counter_dispatcher.contract_address);

   let current_counter = counter_dispatcher.get_counter();
   let expected_counter:u32=1;
   assert!(current_counter==expected_counter,"Increment function failed");

   let expected_event = CounterChanged{
      caller:owner_address(),
      old_value:init_counter,
      new_value:expected_counter,
      reason:ChangeReason::Increase,
   };
   spy.assert_emitted(@array![(
      counter_dispatcher.contract_address,
      Event::CounterChanged(expected_event)
   )])
}
#[test]
fn test_decrease_counter_happy_path(){
   let init_counter:u32=4;
   let counter_dispatcher = deploy_counter(init_counter); 
   let mut spy = spy_events();
   start_cheat_caller_address(counter_dispatcher.contract_address, owner_address());
   counter_dispatcher.decrease_counter();
   stop_cheat_caller_address(counter_dispatcher.contract_address);
   let current_counter = counter_dispatcher.get_counter();
   let expected_counter:u32=3;
   assert!(current_counter==expected_counter,"Decrement function failed");

    let expected_event = CounterChanged{
      caller:owner_address(),
      old_value:init_counter,
      new_value:expected_counter,
      reason:ChangeReason::Decrease,
   };
   spy.assert_emitted(@array![(
      counter_dispatcher.contract_address,
      Event::CounterChanged(expected_event)
   )])
}
#[test]
#[should_panic(expected:"Counter cannot be negative")]
fn test_decrease_counter_fail_path(){
   let init_counter:u32=0;
   let counter_dispatcher = deploy_counter(init_counter); 

   counter_dispatcher.decrease_counter();// <-- should panic here
}

#[test]
fn test_set_counter_owner(){
   let init_counter:u32=0;
   let counter_dispatcher = deploy_counter(init_counter); 
   let mut spy = spy_events();
   start_cheat_caller_address(counter_dispatcher.contract_address, owner_address());
   counter_dispatcher.set_counter(10);
   stop_cheat_caller_address(counter_dispatcher.contract_address);
   let current_counter = counter_dispatcher.get_counter();
   let expected_counter:u32=10;
   assert!(current_counter==expected_counter,"Set counter by owner failed");
   let expected_event = CounterChanged{
      caller:owner_address(),
      old_value:init_counter,
      new_value:expected_counter,
      reason:ChangeReason::Set,
   };
   spy.assert_emitted(@array![(
      counter_dispatcher.contract_address,
      Event::CounterChanged(expected_event)
   )])

}

#[test]
#[should_panic(expected:'Caller is not the owner')]
fn test_set_counter_non_owner(){
   let init_counter:u32=0;
   let counter_dispatcher = deploy_counter(init_counter); 

   start_cheat_caller_address(counter_dispatcher.contract_address, non_owner_address());
   counter_dispatcher.set_counter(10);// <-- should panic here
   stop_cheat_caller_address(counter_dispatcher.contract_address);
}

#[test]
#[should_panic(expected:"Insufficient STRK balance to reset counter")]
fn test_reset_counter_insufficient_balance(){
   let init_counter:u32=5;
   let counter_dispatcher = deploy_counter(init_counter); 

   start_cheat_caller_address(counter_dispatcher.contract_address, non_owner_address());
   counter_dispatcher.reset_counter();// <-- should panic here
}

#[test]
#[should_panic(expected:"Insufficient STRK allowance to reset counter")]
fn test_reset_counter_insufficient_allowance(){
   let init_counter:u32=5;
   let counter_dispatcher = deploy_counter(init_counter); 
   let caller = non_owner_address();
   set_balance(caller,strk_to_fri(10),Token::STRK);// set 10 STRK balance
   // we need to set the caller address to a non-owner address with sufficient balance but no allowance.
   start_cheat_caller_address(counter_dispatcher.contract_address, caller);
   counter_dispatcher.reset_counter();// <-- should panic here
}

#[test]
fn test_reset_counter_success(){
   let init_counter:u32=5;
   let counter_dispatcher = deploy_counter(init_counter); 
   let token_dispatcher = IERC20Dispatcher{contract_address:stark_address()};
   let mut spy = spy_events();
   let caller = non_owner_address();
   set_balance(caller,strk_to_fri(10),Token::STRK);// set 10 STRK balance
   // we need to set the caller address to a non-owner address with sufficient balance and allowance.
   start_cheat_caller_address(token_dispatcher.contract_address, caller);
   token_dispatcher.approve(counter_dispatcher.contract_address,strk_to_fri(1));// approve 1 STRK allowance
   stop_cheat_caller_address(token_dispatcher.contract_address);

   start_cheat_caller_address(counter_dispatcher.contract_address, caller);
   counter_dispatcher.reset_counter();// should pass now
   stop_cheat_caller_address(counter_dispatcher.contract_address);

   // check if counter is reset to 0.
   let current_counter = counter_dispatcher.get_counter();
   let expected_counter:u32=0;
   assert!(current_counter==expected_counter,"Reset counter by non-owner failed");
   // check if STRK balance is deducted by 1 STRK.
   let user_new_balance = token_dispatcher.balance_of(caller);
   let owner_new_balance = token_dispatcher.balance_of(owner_address());
   let user_expected_balance = strk_to_fri(9);// 10 - 1 STRK
   let owner_expected_balance =strk_to_fri(1);// 0 + 1 STRK
   assert!(user_new_balance==user_expected_balance,"User STRK balance after reset is incorrect");
   assert!(owner_new_balance==owner_expected_balance,"Owner STRK balance after reset is incorrect");
   
   // check if allowance is reset to 0.
   let new_allowance = token_dispatcher.allowance(caller,counter_dispatcher.contract_address);
   let expected_allowance = 0_u256;// 1 - 1 STRK
   assert!(new_allowance==expected_allowance,"STRK allowance after reset is incorrect");
   // check if we have emitted the event.
   let expected_event = CounterChanged{
      caller:caller,
      old_value:init_counter,
      new_value:expected_counter,
      reason:ChangeReason::Reset,
   };
   spy.assert_emitted(@array![(
      counter_dispatcher.contract_address,
      Event::CounterChanged(expected_event)
   )]);
}