# Security Specification for DM Frotas

## Data Invariants
1. A Fuel Log must reference a valid Vehicle and significantly, the fuel quantity cannot exceed the Tank's capacity.
2. Only Admins and Managers can modify Stocks and Employees.
3. Drivers can only create Fuel Logs and view their own profile.
4. Maintenance logs are critical for safety; their terminal state 'completed' locks the record (except for Admins).

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a user profile for another UID.
2. **Role Escalation**: A driver attempting to update their role to 'admin'.
3. **Invalid Vehicle ID**: Creating a fuel log with a non-existent or malformed vehicle ID.
4. **Massive Payload**: Attempting to injection 1MB of text into the 'model' field of a vehicle.
5. **Ghost Fields**: Adding `isVerified: true` to a vehicle creation payload.
6. **Negative Fuel**: Refueling -50 liters.
7. **License Spoofing**: Setting a driver's license expiration date in the past during creation.
8. **Invalid Status**: Setting vehicle status to 'on_the_moon'.
9. **Unauthorized Stock Update**: A driver attempting to decrement stock items.
10. **Orphaned Fuel Log**: Logging fuel for a vehicle that doesn't exist in the database.
11. **Future Odometer**: Logging an odometer reading that is 1 million km ahead of current.
12. **Admin Lockdown**: Attempting to delete the last admin user.

## Test Runner (Draft)
The tests will verify that all above payloads are rejected with PERMISSION_DENIED.
