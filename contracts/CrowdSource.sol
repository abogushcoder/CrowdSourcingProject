//Get funds from users
//Withdraw funds
// Set a minimum funding value in USD

//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;


import {PriceConverter} from "./PriceConverter.sol";

error NotOwner();
error TransactionFailed();
error NotEnoughMoney();

contract CrowdSource {

    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 5e18;

    address[] public funders;

    mapping(address funder => uint256 amountFunded) public addressToAmountFunded;

    address public immutable i_owner;

    constructor() {
        i_owner = msg.sender;
    } 


    function fund() public payable{
        if (msg.value.getConversionRate() >= MINIMUM_USD) { // 1e18 = 1 ETH
            revert NotEnoughMoney();
        }
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] += msg.value;
    }

   

    function withdraw() public onlyOwner{

        for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++){
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        if (!callSuccess) {
            revert TransactionFailed();
        }
    }

    modifier onlyOwner() {
        if(msg.sender != i_owner) {
            revert NotOwner();
        }
        _; // the underscore tells the function which contains the modifier in its declaration to execute the require then anything else that is in the function
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
