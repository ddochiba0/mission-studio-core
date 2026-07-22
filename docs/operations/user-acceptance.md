# Mission Studio V2 — user acceptance checklist

Record one result for each item: `PASS`, `FAIL`, or `HOLD`.

1. **Login and logout** — valid user signs in; wrong password shows a clear recovery message; logout returns to local-only operation.
2. **Account isolation** — user B cannot read, update, or delete user A's server missions.
3. **PC to mobile** — a mission created on PC appears on mobile after login or manual synchronization.
4. **Mobile to PC** — a mobile edit appears on PC without duplicate missions.
5. **Offline recovery** — editing continues offline and the pending count reaches zero after reconnection.
6. **Delete propagation** — deletion on one device reaches the other device and does not reappear.
7. **Conflict choice** — simultaneous offline edits show both versions; each resolution button produces the selected result.

Testing remains incomplete until the device/account, date, result, and observed issue are recorded for all seven items.
