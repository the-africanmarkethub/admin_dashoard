"use client";

import { useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ChatMessagesSkeleton from "./ChatMessagesSkeleton";
import { Message } from "@/types/Ticket";
import Image from "next/image";
import { formatHumanReadableDate } from "@/utils/formatDate";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ChatMessagesProps {
    messages: Message[];
    isloadingChatMessage: boolean;
}

export default function ChatMessages({
    messages,
    isloadingChatMessage,
}: ChatMessagesProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom whenever messages change OR loading finishes
    useEffect(() => {
        if (!isloadingChatMessage && messages.length > 0) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isloadingChatMessage]);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-hub-primary/10 custom-scrollbar">
            {isloadingChatMessage ? (
                /* The Skeleton should now look like the admin chat layout */
                <ChatMessagesSkeleton />
            ) : messages.length > 0 ? (
                messages.map((msg: any, i: number) => {
                    const isCustomer = msg.sender_type === "customer";

                    return (
                        <div
                            key={msg.id || i}
                            className={cn(
                                "flex w-full flex-col",
                                isCustomer ? "items-start" : "items-end",
                            )}
                        >
                            {/* Identity Label */}
                            <span className="text-[10px] font-bold uppercase text-gray-400 mb-1 px-1 tracking-tight">
                                {isCustomer ? "Customer" : "Service Provider"}
                            </span>

                            <div
                                className={cn(
                                    "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all",
                                    isCustomer
                                        ? "bg-white border border-gray-100 rounded-tl-none text-gray-800"
                                        : "bg-hub-secondary rounded-tr-none text-white shadow-blue-100",
                                )}
                            >
                                {/* Image Attachment */}
                                {msg.file && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-black/5 bg-gray-100">
                                        <a
                                            href={msg.file}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block"
                                        >
                                            <Image
                                                src={msg.file}
                                                alt="Attachment"
                                                className="object-cover w-full h-auto max-h-60 hover:opacity-90 transition-opacity"
                                                width={300}
                                                height={200}
                                                unoptimized
                                            />
                                        </a>
                                    </div>
                                )}

                                <p className="whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.text}
                                </p>

                                {/* Metadata */}
                                <div
                                    className={cn(
                                        "flex items-center gap-1 mt-2 text-[9px] font-medium opacity-70",
                                        isCustomer
                                            ? "text-gray-500"
                                            : "text-blue-50",
                                    )}
                                >
                                    <span>
                                        {formatHumanReadableDate(msg.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic py-20">
                    <div className="p-4 bg-gray-100 rounded-full mb-3">
                        <Image
                            src="/placeholder.png"
                            width={40}
                            height={40}
                            alt="empty"
                            className="opacity-20"
                        />
                    </div>
                    No messages in this dispute log.
                </div>
            )}
            <div ref={scrollRef} className="h-2 w-full shrink-0" />
        </div>
    );
}
