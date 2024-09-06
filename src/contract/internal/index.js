const AdminControl = {
  abi: [
    'function getAdmin(address contractAddr) public view returns (address)',
    'function setAdmin(address contractAddr, address newAdmin)',
    'function destroy(address contractAddr)',
  ],
  address: '0x0888000000000000000000000000000000000000',
};

const SponsorWhitelistControl = {
  abi: [
    'function getSponsorForGas(address contractAddr) public view returns (address)',
    'function getSponsoredBalanceForGas(address contractAddr) public view returns (uint256)',
    'function getSponsoredGasFeeUpperBound(address contractAddr) public view returns (uint256)',
    'function getSponsorForCollateral(address contractAddr) public view returns (address)',
    'function getSponsoredBalanceForCollateral(address contractAddr) public view returns (uint256)',
    'function isWhitelisted(address contractAddr, address user) public view returns (bool)',
    'function isAllWhitelisted(address contractAddr) public view returns (bool)',
    'function addPrivilegeByAdmin(address contractAddr, address[] memory addresses)',
    'function removePrivilegeByAdmin(address contractAddr, address[] memory addresses)',
    'function setSponsorForGas(address contractAddr, uint upperBound)',
    'function setSponsorForCollateral(address contractAddr)',
    'function getAvailableStoragePoints(address contractAddr) public view returns (uint256)',
    // 'function addPrivilege(address[] memory)',
    // 'function removePrivilege(address[] memory)',
  ],
  address: '0x0888000000000000000000000000000000000001',
};




const CrossSpaceCall = {
  abi: [
    'event Call(bytes20 indexed sender, bytes20 indexed receiver, uint256 value, uint256 nonce, bytes data)',
    'event Create(bytes20 indexed sender, bytes20 indexed contract_address, uint256 value, uint256 nonce, bytes init)',
    'event Withdraw(bytes20 indexed sender, address indexed receiver, uint256 value, uint256 nonce)',
    'event Outcome(bool success)',
    'function createEVM(bytes calldata init) external payable returns (bytes20)',
    'function transferEVM(bytes20 to) external payable returns (bytes memory output)',
    'function callEVM(bytes20 to, bytes calldata data) external payable returns (bytes memory output)',
    'function staticCallEVM(bytes20 to, bytes calldata data) external view returns (bytes memory output)',
    'function withdrawFromMapped(uint256 value)',
    'function mappedBalance(address addr) external view returns (uint256)',
    'function mappedNonce(address addr) external view returns (uint256)',
  ],
  address: '0x0888000000000000000000000000000000000006',
};

const ParamsControl = {
  abi: [
    'function castVote(uint64 vote_round, tuple(uint16 topic_index, uint256[3] votes)[] vote_data)',
    'function readVote(address addr) view returns (tuple(uint16 topic_index, uint256[3] votes)[])',
    'function currentRound() external view returns (uint64)',
    'function totalVotes(uint64 vote_round) external view returns (tuple(uint16 topic_index, uint256[3] votes)[])',
    'event CastVote(uint64 indexed vote_round, address indexed addr, uint16 indexed topic_index, uint256[3] votes)',
    'event RevokeVote(uint64 indexed vote_round, address indexed addr, uint16 indexed topic_index, uint256[3] votes)',
  ],
  address: '0x0888000000000000000000000000000000000007',
};

module.exports = {
  AdminControl,
  SponsorWhitelistControl,
  // MazzeContext,
  CrossSpaceCall,
  ParamsControl,
};
