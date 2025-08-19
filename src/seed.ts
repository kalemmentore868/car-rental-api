import "dotenv/config";
import { faker } from "@faker-js/faker";
import { db } from "./firebase";

const COLLECTIONS = {
  cars: "cars",
  users: "users",
  contracts: "contract_form_data",
} as const;

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const randTimeStr = () =>
  `${String(randInt(8, 20)).padStart(2, "0")}:${String(
    [0, 15, 30, 45][randInt(0, 3)]
  ).padStart(2, "0")}`;

function mapCarToContractFields(car: any) {
  return {
    carLicenseNo: car.licensePlate,
    carMake: car.brand,
    carModel: car.model,
    carColor: car.color,
    carMonthlyRate: car?.rentalRate?.monthly?.rate ?? 0,
    carDailyRate: car?.rentalRate?.daily ?? 0,
  };
}

async function fetchExistingCars() {
  const snap = await db.collection(COLLECTIONS.cars).get();
  const cars = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (cars.length === 0) throw new Error("No cars found. Seed cars first.");
  return cars;
}

async function fetchExistingCustomers(limit = 10) {
  // prefer AppUsers of type "customer" (created earlier)
  const snap = await db
    .collection(COLLECTIONS.users)
    .where("type", "==", "customer")
    .limit(limit)
    .get();

  const users = snap.docs.map((d) => d.data() as any);
  if (users.length < limit) {
    console.warn(
      `Only found ${users.length} customer users; proceeding with what’s available.`
    );
  }
  if (users.length === 0) throw new Error("No customer users found.");
  return users;
}

async function seedContractsFromExisting() {
  console.log("🔰 Seeding contracts from existing cars & users...");

  const cars = await fetchExistingCars();
  const customers = await fetchExistingCustomers(10);

  // Prepare statuses: 8 approved, 1 pending, 1 declined
  const statuses: Array<"approved" | "pending" | "declined"> = [
    ...Array(8).fill("approved"),
    "pending",
    "declined",
  ].sort(() => Math.random() - 0.5);

  const batch = db.batch();

  for (let i = 0; i < 10; i++) {
    const user = customers[i % customers.length]; // rotate if fewer than 10
    const car = pick(cars);
    const carFields = mapCarToContractFields(car);

    // Dates
    const start = faker.date.recent({ days: 60 }); // within last 60 days
    const days = randInt(2, 10);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    // Driver (primary)
    const primaryFirst = faker.person.firstName();
    const primaryLast = faker.person.lastName();

    // Additional drivers (0–2)
    const addDriversCount = randInt(0, 2);
    const additionalDrivers = Array.from({ length: addDriversCount }).map(
      () => ({
        name: faker.person.fullName(),
        permitNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
        issueDate: toDateStr(faker.date.past({ years: 8 })),
        expiryDate: toDateStr(faker.date.future({ years: 5 })),
        birthDate: toDateStr(
          faker.date.birthdate({ min: 1975, max: 2005, mode: "year" })
        ),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        permitImageUrl: "https://via.placeholder.com/600x400?text=Permit",
      })
    );

    const status = statuses[i];
    const isApproved = status === "approved";
    const isDeclined = status === "declined";

    const amount = (carFields.carDailyRate || 0) * days;
    const amountPaid = isApproved ? randInt(0, amount) : 0;

    // Build the contract doc WITHOUT undefined fields
    const baseDoc: any = {
      userId: user.uid,
      email: user.email,

      // Primary driver
      name: `${primaryFirst} ${primaryLast}`,
      permitNumber: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      issueDate: toDateStr(faker.date.past({ years: 10 })),
      expiryDate: toDateStr(faker.date.future({ years: 5 })),
      birthDate: toDateStr(
        faker.date.birthdate({ min: 1975, max: 2005, mode: "year" })
      ),
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      permitImageUrl: "https://via.placeholder.com/600x400?text=Permit",

      additionalDrivers,

      // Collision Damage Waiver
      collisionAcceptance: faker.datatype.boolean(),

      // Vehicle info
      ...carFields,

      // Rental dates/times
      dateOut: toDateStr(start),
      timeOut: randTimeStr(),
      dateDue: toDateStr(end),
      timeIn: randTimeStr(),
      pickUpLocation: pick([
        "POS Airport",
        "Piarco",
        "Port of Spain",
        "San Fernando",
      ]),
      childSeatNeeded: pick(["Yes", "No"]),
      additionalNotes: faker.lorem.sentence(),

      // Status mapping
      approved: isApproved,

      dateCreated: toDateStr(new Date()),
      amount,
      noOfDays: days,
      amountPaid,
      fuelAmount: pick([
        "Full",
        "Half",
        "Empty",
        "Quarter",
        "Three Quarters",
      ]) as "Full" | "Half" | "Empty" | "Quarter" | "Three Quarters",
      paymentMethod: pick(["Cash", "Debit/Credit Card", "Cheque"]) as
        | "Cash"
        | "Debit/Credit Card"
        | "Cheque",

      returnLocation: pick(["Same as pickup", "POS Office", "Airport"]),
      flightNumber: `BW${randInt(100, 999)}`,
      hotelAddress: faker.location.streetAddress(),
      pricePerQuarter: Math.round((carFields.carDailyRate || 0) / 4),
      damages: [] as { damageDescription: string; damageImageUrl: string }[],
      createdAt: new Date(),
    };

    // Only add declineReason when declined (omit otherwise)
    const contractDoc = {
      ...baseDoc,
      ...(isDeclined && {
        approved: false,
        declineReason: pick([
          "Missing documentation",
          "Card declined",
          "Vehicle unavailable",
        ]),
      }),
      // If pending, explicitly set approved: false and DO NOT set declineReason
      ...(status === "pending" && { approved: false }),
    };

    const ref = db.collection(COLLECTIONS.contracts).doc();
    batch.set(ref, contractDoc);
  }

  await batch.commit();
  console.log("✅ Contracts created from existing data");
}

(async () => {
  try {
    await seedContractsFromExisting();
    console.log("🎉 Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
})();
