import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    content: string;
    alias: string;
    timestamp: Time;
}
export type Time = bigint;
export interface backendInterface {
    getAllMessages(): Promise<Array<Message>>;
    postMessage(alias: string, content: string): Promise<void>;
}
