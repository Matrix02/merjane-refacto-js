import { products } from "@/db/schema.js";
import { eq } from "drizzle-orm";

export async function processProduct(
	p: typeof products.$inferSelect,
	db: any,
	ps: any,
) {
	const update = () => db.update(products).set(p).where(eq(products.id, p.id));

	switch (p.type) {
		case 'NORMAL':
			if (p.available > 0) {
				p.available -= 1;
				await update();
			} else if (p.leadTime > 0) {
				await ps.notifyDelay(p.leadTime, p);
			}
			break;

		case 'SEASONAL': {
			const now = new Date();
			if (now > p.seasonStartDate! && now < p.seasonEndDate! && p.available > 0) {
				p.available -= 1;
				await update();
			} else {
				await ps.handleSeasonalProduct(p);
			}
			break;
		}

		case 'EXPIRABLE': {
			const now = new Date();
			if (p.available > 0 && p.expiryDate! > now) {
				p.available -= 1;
				await update();
			} else {
				await ps.handleExpiredProduct(p);
			}
			break;
		}
	}
}