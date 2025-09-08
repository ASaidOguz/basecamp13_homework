use starknet::ContractAddress;

pub fn stark_address() -> ContractAddress{
   0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d.try_into().unwrap()
}

pub fn strk_to_fri(amount:u256) -> u256{
   let mut decimals = 18_u8;
   let mut amount = amount;
   while decimals != 0 {
      amount = amount * 10_u256;
      decimals -=1;
   }
   amount
}

#[cfg(test)]
mod tests {
   use super::strk_to_fri;

   #[test]
   fn test_strk_to_fri() {
      let expected_value :u256 = 1_000_000_000_000_000_000_u256; // 1 STRK in FRI
      let value = strk_to_fri(1_u256);
      assert!(expected_value==value,"expected {expected_value}, got {value}");
   }
}