// export type Frequency='ONCE'|'EVERY_30_MINUTES'|'EVERY_HOUR'|'DAILY';
// export type Status='PENDING'|'ACTIVE'|'REJECTED'|'CANCELLED'|'COMPLETED';
// export type User={id:string;name:string;email:string;circleId:string;owner?:boolean};
// export type Reminder={id:string;creatorId:string;receiverId:string;circleId:string;message:string;frequency:Frequency;startAt:number;nextRunAt:number;endAt?:number|null;status:Status;createdAt:number;creatorName?:string;receiverName?:string};

export type Frequency = "ONCE" | "EVERY_30_MINUTES" | "EVERY_HOUR" | "DAILY";
export type Status =
	| "PENDING"
	| "ACTIVE"
	| "REJECTED"
	| "CANCELLED"
	| "COMPLETED";

export interface User {
	id: string;
	name: string;
	email: string;
	circleId: string;
	owner: boolean;
	createdAt?: number;
	updatedAt?: number;
}

export interface Reminder {
	id: string;
	circleId: string;
	creatorId: string;
	receiverId: string;
	message: string;
	frequency: Frequency;
	startAt: number;
	nextRunAt: number;
	endAt: number | null;
	status: Status;
	createdAt: number;
	updatedAt: number;
	creatorName?: string;
	receiverName?: string;
}
