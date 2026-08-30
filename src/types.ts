export type Frequency =
	| "ONCE"
	| "EVERY_1_HOUR"
	| "EVERY_2_HOURS"
	| "EVERY_3_HOURS"
	| "EVERY_4_HOURS"
	| "EVERY_5_HOURS"
	| "EVERY_6_HOURS"
	| "EVERY_7_HOURS"
	| "EVERY_8_HOURS"
	| "EVERY_9_HOURS"
	| "EVERY_10_HOURS"
	| "EVERY_11_HOURS"
	| "EVERY_12_HOURS"
	| "DAILY";

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
