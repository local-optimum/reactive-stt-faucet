"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect, useRef } from "react";
import { TOKEN_FAUCET_REQUEST_ADDRESS, tokenFaucetRequestABI } from "@/lib/contracts";

export type ClaimState =
  | "idle"
  | "pending"
  | "confirming"
  | "success"
  | "denied"
  | "error";

export function useTokenClaim(onSuccess?: () => void) {
  const [state, setState] = useState<ClaimState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    writeContract,
    data: hash,
    error: writeError,
    reset,
  } = useWriteContract();

  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const { isSuccess: isConfirmed, isError: txFailed } =
    useWaitForTransactionReceipt({ hash });

  const claim = () => {
    setState("pending");
    setErrorMsg("");
    writeContract({
      address: TOKEN_FAUCET_REQUEST_ADDRESS,
      abi: tokenFaucetRequestABI,
      functionName: "request",
    });
  };

  useEffect(() => {
    if (hash && state === "pending") {
      setState("confirming");
    }
  }, [hash, state]);

  useEffect(() => {
    if (isConfirmed && state === "confirming") {
      setState("success");
      onSuccess?.();
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setState("idle");
        reset();
      }, 3000);
    }
  }, [isConfirmed, state, onSuccess, reset]);

  useEffect(() => {
    if (writeError) {
      setState("error");
      setErrorMsg(writeError.message.split("\n")[0]);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setState("idle");
        reset();
        setErrorMsg("");
      }, 3000);
    }
  }, [writeError, reset]);

  useEffect(() => {
    if (txFailed) {
      setState("error");
      setErrorMsg("Transaction failed");
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setState("idle");
        reset();
        setErrorMsg("");
      }, 3000);
    }
  }, [txFailed, reset]);

  return { claim, state, errorMsg, hash };
}
