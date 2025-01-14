'use client'

import React, { useEffect, useState } from 'react'

import { ChevronDown } from 'lucide-react';

import { VersionedTransaction } from '@solana/web3.js';

import Decimal from 'decimal.js';

import { useSolanaWallets } from '@privy-io/react-auth';

import { Button } from '@/components/ui';

import LogInButton from '@/app/(app)/_components/log-in-button';

import TokenInput from './token-input';

import { useSendTransaction, useTokenBalance } from '@/hooks';

import { getSwapObj, getQuote } from '@/services/jupiter';

import type { QuoteResponse } from '@jup-ag/api';
import type { Token } from '@/db/types';

interface Props {
    initialInputToken: Token | null,    
    initialOutputToken: Token | null,
    initialInputAmount?: string,
    swapText?: string,
    swappingText?: string,
    onSuccess?: (txHash: string) => void,
    onError?: (error: string) => void,
    onCancel?: () => void,
}

const Swap: React.FC<Props> = ({ initialInputToken, initialOutputToken, initialInputAmount, swapText, swappingText, onSuccess, onError, onCancel }) => {

    const { wallets } = useSolanaWallets();

    const [inputAmount, setInputAmount] = useState<string>(initialInputAmount || "");
    const [inputToken, setInputToken] = useState<Token | null>(initialInputToken);

    const [outputAmount, setOutputAmount] = useState<string>("");
    const [outputToken, setOutputToken] = useState<Token | null>(initialOutputToken);

    const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
    const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);

    const [isSwapping, setIsSwapping] = useState<boolean>(false);

    const { sendTransaction } = useSendTransaction();

    const { balance: inputBalance, isLoading: inputBalanceLoading } = useTokenBalance(inputToken?.id || "", wallets[0]?.address || "");

    const onChangeInputOutput = () => {
        const tempInputToken = inputToken;
        const tempInputAmount = inputAmount;
        setInputToken(outputToken);
        setInputAmount(outputAmount);
        setOutputToken(tempInputToken);
        setOutputAmount(tempInputAmount);
    }

    const onSwap = async () => {
        if(wallets.length === 0 || !quoteResponse) return;
        setIsSwapping(true);
        try {
            const { swapTransaction} = await getSwapObj(wallets[0].address, quoteResponse);
            const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            const txHash = await sendTransaction(transaction);
            onSuccess?.(txHash);
        } catch (error) {
            onError?.(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setIsSwapping(false);
        }
    }

    useEffect(() => {
        if (inputToken && outputToken && inputAmount && Number(inputAmount) > 0) {
            const fetchQuoteAndUpdate = async () => {
                setIsQuoteLoading(true);
                setOutputAmount("");
                const quote = await getQuote(inputToken.id, outputToken.id, parseFloat(inputAmount) * (10 ** inputToken.decimals));
                setQuoteResponse(quote);
                setOutputAmount(new Decimal(quote.outAmount).div(new Decimal(10).pow(outputToken.decimals)).toString());
                setIsQuoteLoading(false);
            }
            fetchQuoteAndUpdate();
        }
    }, [inputToken, outputToken, inputAmount]);
    
    return (
        <div className="flex flex-col gap-4 w-96">
            <div className="flex flex-col gap-2 items-center w-full">
                <TokenInput
                    amount={inputAmount}
                    onChange={setInputAmount}
                    token={inputToken}
                    onChangeToken={setInputToken}
                    address={wallets[0]?.address}
                />
                <Button 
                    variant="ghost" 
                    size="icon"
                    className="group"
                    onClick={onChangeInputOutput}
                >
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </Button>
                <TokenInput
                    amount={outputAmount}
                    token={outputToken}
                    onChangeToken={setOutputToken}
                    address={wallets[0]?.address}
                />
            </div>
            {
                wallets.length > 0 ? (
                    <Button 
                        variant="brand" 
                        className="w-full"
                        onClick={onSwap}
                        disabled={isSwapping || isQuoteLoading || !quoteResponse || !inputToken || !outputToken || !inputAmount || !outputAmount || !inputBalance || inputBalanceLoading || Number(inputAmount) > Number(inputBalance)}
                    >
                        {
                            isQuoteLoading 
                                ? "Loading..." 
                                : Number(inputAmount) > Number(inputBalance)
                                    ? "Insufficient balance"
                                    : isSwapping
                                        ? swappingText || "Swapping..."
                                        : swapText || "Swap"
                        }
                    </Button>
                ) : (
                    <LogInButton />
                )
            }
            {
                onCancel && (
                    <Button variant="ghost" className="w-full" onClick={onCancel}>Cancel</Button>
                )
            }
        </div>
    )
}

export default Swap;