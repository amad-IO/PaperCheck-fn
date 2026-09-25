import CONTRACT_ABI from './contractAbi.json';

// Ganti alamat ini setelah Anda men-deploy smart contract ke Base Sepolia atau testnet lainnya
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x35A323b4543BE05666fB953dae959d303A06325E';

export { CONTRACT_ABI };
