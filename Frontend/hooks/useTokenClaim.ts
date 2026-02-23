"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect } from "react";
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
      const timer = setTimeout(() => {
        setState("idle");
        reset();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, state, onSuccess, reset]);

  useEffect(() => {
    if (writeError) {
      setState("error");
      setErrorMsg(writeError.message.split("\n")[0]);
      const timer = setTimeout(() => {
        setState("idle");
        reset();
        setErrorMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [writeError, reset]);

  useEffect(() => {
    if (txFailed) {
      setState("error");
      setErrorMsg("Transaction failed");
      const timer = setTimeout(() => {
        setState("idle");
        reset();
        setErrorMsg("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [txFailed, reset]);

  return { claim, state, errorMsg, hash };
}
