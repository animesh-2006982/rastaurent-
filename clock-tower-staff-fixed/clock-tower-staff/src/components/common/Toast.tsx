"use client";
export default function Toast({message,onClose}:{message:string;onClose:()=>void}){return <button className="toast" onClick={onClose}>{message}</button>}
