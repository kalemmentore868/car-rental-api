import { AppUser, ContractFormData } from "./types";

export function generateCustomerEmailTemplate(
  contract: ContractFormData,
  user: AppUser
): string {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0B5394;">Hi ${user.firstName},</h2>
      <p>Thank you for submitting your car rental request! Here’s a summary:</p>

      <h3 style="margin-top: 20px;">Rental Details</h3>
      <ul style="line-height: 1.6;">
        <li><strong>Car:</strong> ${contract.carMake} ${contract.carModel} (${
    contract.carColor
  })</li>
        <li><strong>License Plate:</strong> ${contract.carLicenseNo}</li>
        <li><strong>Rental Dates:</strong> ${contract.dateOut} ${
    contract.timeOut
  } → ${contract.dateDue} ${contract.timeIn}</li>
        <li><strong>Daily Rate:</strong> $${contract.carDailyRate.toFixed(
          2
        )}</li>
      </ul>

      ${
        contract.additionalCars && contract.additionalCars.length > 0
          ? `
        <h4>Additional Cars:</h4>
        <ul>
          ${contract.additionalCars
            .map(
              (car) =>
                `<li>${car.carMake} ${car.carModel} (${
                  car.carLicenseNo
                }) @ $${car.carDailyRate.toFixed(2)}/day</li>`
            )
            .join("")}
        </ul>
      `
          : ""
      }

      <p style="margin-top: 20px;">
        We’ll review your request and follow up shortly. If you have questions, feel free to contact us.
      </p>

      <p style="margin-top: 40px; font-size: 0.9em; color: #777;">
        ${new Date().toLocaleString()}
      </p>
    </div>
  `;
}

export function generateAdminEmailTemplate(
  contract: ContractFormData,
  user: AppUser,
  platformUrl: string
): string {
  const rentalDays = Math.max(
    Math.ceil(
      (new Date(contract.dateDue).getTime() -
        new Date(contract.dateOut).getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    1
  );

  const primaryTotal = rentalDays * contract.carDailyRate;
  const additionalTotal =
    contract.additionalCars?.reduce(
      (acc, car) => acc + rentalDays * car.carDailyRate,
      0
    ) || 0;

  const grandTotal = primaryTotal + additionalTotal;

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #222;">
      <h2 style="color: #B30000;">New Rental Contract Submitted</h2>

      <h3 style="margin-top: 20px;">Customer Info</h3>
      <ul style="line-height: 1.6;">
        <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Phone:</strong> ${user.profile?.phone}</li>
        <li><strong>Permit No.:</strong> ${user.profile?.permitNumber}</li>
        <li><strong>Nationality:</strong> ${
          user.profile?.nationality || "N/A"
        }</li>
        <li><strong>Birth Date:</strong> ${user.profile?.birthDate}</li>
      </ul>

      <h3 style="margin-top: 20px;">Primary Car</h3>
      <ul style="line-height: 1.6;">
        <li><strong>Vehicle:</strong> ${contract.carMake} ${
    contract.carModel
  } (${contract.carColor})</li>
        <li><strong>License Plate:</strong> ${contract.carLicenseNo}</li>
        <li><strong>Daily Rate:</strong> $${contract.carDailyRate.toFixed(
          2
        )}</li>
        <li><strong>Rental Duration:</strong> ${rentalDays} day(s)</li>
        <li><strong>Subtotal:</strong> $${primaryTotal.toFixed(2)}</li>
      </ul>

      ${
        contract.additionalCars?.length
          ? `
        <h3>Additional Cars</h3>
        <ul style="line-height: 1.6;">
          ${contract.additionalCars
            .map(
              (car) => `
            <li>
              ${car.carMake} ${car.carModel} (${
                car.carLicenseNo
              }) - $${car.carDailyRate.toFixed(
                2
              )}/day × ${rentalDays} days = $${(
                car.carDailyRate * rentalDays
              ).toFixed(2)}
            </li>`
            )
            .join("")}
        </ul>
        <p><strong>Additional Total:</strong> $${additionalTotal.toFixed(2)}</p>
      `
          : ""
      }

      <h3>Total: <span style="color: green;">$${grandTotal.toFixed(
        2
      )}</span></h3>

      <p style="margin-top: 30px;">
        <a href="${platformUrl}" style="display:inline-block; background-color:#0B5394; color:#fff; padding:10px 20px; border-radius:5px; text-decoration:none;">
          View in Admin Dashboard
        </a>
      </p>

      <p style="font-size: 0.9em; color: #777;">
        Submitted: ${new Date().toLocaleString()}
      </p>
    </div>
  `;
}

export function generateCustomerEmailTemplateWithAttachments(
  contract: ContractFormData,
  user: AppUser
): string {
  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")}${ampm}`;
  };

  const shortId = contract.id?.slice(0, 6).toUpperCase() ?? "N/A";

  return `
  <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 30px; background: #f9f9f9; color: #333;">
   

    <h2 style="text-align: center; color: #222;">RENTAL / LEASING CONTRACT SUMMARY</h2>

    <h3 style="margin-top: 30px; color: #444;">Lessee Information</h3>
    <table cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
      <tr><td><strong>Name:</strong></td><td>${contract.name}</td></tr>
      <tr><td><strong>Permit #:</strong></td><td>${
        contract.permitNumber
      }</td></tr>
      <tr><td><strong>Issue Date:</strong></td><td>${
        contract.issueDate
      }</td></tr>
      <tr><td><strong>Expiry Date:</strong></td><td>${
        contract.expiryDate
      }</td></tr>
      <tr><td><strong>Birth Date:</strong></td><td>${
        contract.birthDate
      }</td></tr>
      <tr><td><strong>Address:</strong></td><td>${contract.address}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${contract.phone}</td></tr>
      ${
        contract.foreignAddress
          ? `<tr><td><strong>Foreign Address:</strong></td><td>${contract.foreignAddress}</td></tr>`
          : ""
      }
      ${
        contract.foreignPhone
          ? `<tr><td><strong>Foreign Phone:</strong></td><td>${contract.foreignPhone}</td></tr>`
          : ""
      }
    </table>

    <h3 style="margin-top: 30px; color: #444;">Vehicle Details</h3>
    <table cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
      <tr><td><strong>Car:</strong></td><td>${contract.carMake} ${
    contract.carModel
  } (${contract.carColor})</td></tr>
      <tr><td><strong>License Plate:</strong></td><td>${
        contract.carLicenseNo
      }</td></tr>
      <tr><td><strong>Daily Rate:</strong></td><td>$${contract.carDailyRate.toFixed(
        2
      )}</td></tr>
      <tr><td><strong>Rental Dates:</strong></td><td>${
        contract.dateOut
      } ${formatTime(contract.timeOut)} → ${contract.dateDue} ${formatTime(
    contract.timeIn
  )}</td></tr>
      ${
        contract.returnLocation
          ? `<tr><td><strong>Return Location:</strong></td><td>${contract.returnLocation}</td></tr>`
          : ""
      }
    </table>

    ${
      contract.additionalCars && contract.additionalCars.length > 0
        ? `
      <h4 style="margin-top: 25px;">Additional Cars</h4>
      <ul style="padding-left: 20px;">
        ${contract.additionalCars
          .map(
            (car) =>
              `<li>${car.carMake} ${car.carModel} (${
                car.carLicenseNo
              }) @ $${car.carDailyRate.toFixed(2)}/day</li>`
          )
          .join("")}
      </ul>
    `
        : ""
    }

    ${
      contract.amount !== undefined
        ? `<p style="margin-top: 20px; font-size: 16px;"><strong>Total Estimated Amount:</strong> <span style="color: green;">$${contract.amount.toFixed(
            2
          )}</span></p>`
        : ""
    }

    <p style="margin-top: 30px; font-size: 14px;">Contract Reference: <strong>${shortId}</strong></p>

    <p style="margin-top: 40px;">
      Thank you for choosing us. We'll be in touch shortly to confirm your booking. If you have any questions, feel free to reply to this email.
    </p>

    <p style="margin-top: 60px; font-size: 12px; color: #aaa; text-align: center;">
      Sent on ${new Date().toLocaleString()}
    </p>
  </div>
  `;
}
