// Start a session
const session = db.getMongo().startSession();

function bookAccommodationAndTransport(user_id, accommodation_id, transport_id, accommodation_price, transport_price) {
    try {
        // Start the transaction
        session.startTransaction();

        // Get the collections within the transaction
        const accommodations = session.getDatabase('travelDB').getCollection('accommodationTable');
        const transports = session.getDatabase('travelDB').getCollection('transportationTable');
        const bookings = session.getDatabase('travelDB').getCollection('bookings');

        // Fetch accommodation and transport details within the transaction
        const accommodation = accommodations.findOne({ _id: accommodation_id });
        const transport = transports.findOne({ _id: transport_id });

        // Check if accommodation and transport exist
        if (!accommodation || !transport) {
            throw new Error('Accommodation or transport does not exist.');
        }

        // Proceed with booking:
        // Step 1: Update accommodation availability (decrease rooms, for example)
        let flag = accommodations.updateOne(
            { _id: accommodation_id },
            { $inc: { available_rooms: -1 } }
        );
        
        if (flag.modifiedCount < 1) {
            throw new Error('Failed to update accommodation availability.');
        }

        // Step 2: Update transport availability (decrease seats, for example)
        flag = transports.updateOne(
            { _id: transport_id },
            { $inc: { available_seats: -1 } }
        );
        
        if (flag.modifiedCount < 1) {
            throw new Error('Failed to update transport availability.');
        }

        // Step 3: Create a booking record
        flag = bookings.insertOne({
            user_id: user_id,
            accomodation_booking_ids: [accommodation_id],
            transportation_booking_ids: [transport_id],
            total_price: accommodation_price + transport_price,
            booking_date: new Date()
        });
        
        if (flag.insertedCount < 1) {
            throw new Error('Failed to create booking record.');
        }

        // Commit the transaction
        session.commitTransaction();
        print(`Transaction committed successfully! Booking created for user ${user_id}.`);

    } catch (error) {
        // If any error occurs, abort the transaction
        session.abortTransaction();
        print("Transaction aborted due to error: ", error.message);
    } finally {
        // End the session
        session.endSession();
    }
}

// Example usage: Book accommodation and transport for a user
bookAccommodationAndTransport(
    ObjectId("user_id_123"),           // user_id
    ObjectId("accommodation_id_456"),  // accommodation_id
    ObjectId("transport_id_789"),      // transport_id
    200,                               // accommodation_price
    150                                // transport_price
);
