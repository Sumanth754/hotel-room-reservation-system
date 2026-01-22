import React, { useState, useEffect } from 'react';
import './Hotel.css';

const Hotel = () => {
  const [rooms, setRooms] = useState([]);
  const [numRooms, setNumRooms] = useState(1);
  const [bookingStatus, setBookingStatus] = useState('');

  useEffect(() => {
    setRooms(generateRooms());
  }, []);

  const generateRooms = () => {
    const allRooms = [];
    // Floors 1-9
    for (let floor = 1; floor <= 9; floor++) {
      for (let roomNum = 1; roomNum <= 10; roomNum++) {
        allRooms.push({
          roomNumber: floor * 100 + roomNum,
          floor: floor,
          positionFromLift: roomNum,
          isOccupied: false,
          isBooked: false,
        });
      }
    }
    // Floor 10
    for (let roomNum = 1; roomNum <= 7; roomNum++) {
      allRooms.push({
        roomNumber: 1000 + roomNum,
        floor: 10,
        positionFromLift: roomNum,
        isOccupied: false,
        isBooked: false,
      });
    }
    return allRooms;
  };

  const calculateTravelTime = (bookedRooms) => {
    if (bookedRooms.length <= 1) {
      return 0;
    }
    // Sort rooms by floor and then by position to find the "first" and "last" room
    const sortedRooms = [...bookedRooms].sort((a, b) => {
      if (a.floor !== b.floor) {
        return a.floor - b.floor;
      }
      return a.positionFromLift - b.positionFromLift;
    });

    const firstRoom = sortedRooms[0];
    const lastRoom = sortedRooms[sortedRooms.length - 1];

    const verticalTravel = Math.abs(lastRoom.floor - firstRoom.floor) * 2;
    // If on the same floor, horizontal travel is the distance between the rooms.
    if (firstRoom.floor === lastRoom.floor) {
      return Math.abs(lastRoom.positionFromLift - firstRoom.positionFromLift);
    }
    // If on different floors, the problem description implies we only care about the time
    // between the first and last rooms in the sequence, not the sum of all segments.
    // The prompt says "total travel time between the first and last room in the booking".
    // This can be interpreted in a few ways. Let's assume it's the time to get from the
    // start of the booking to the end.
    // A simple model: vertical travel + horizontal travel on the last floor.
    const horizontalTravel = lastRoom.positionFromLift - 1; // From lift to the last room
    return verticalTravel + horizontalTravel;
  };

  const handleBooking = () => {
    // 1. Validate input
    if (numRooms < 1 || numRooms > 5) {
      setBookingStatus('You can only book between 1 and 5 rooms at a time.');
      return;
    }

    const availableRooms = rooms.filter((r) => !r.isOccupied);
    if (availableRooms.length < numRooms) {
      setBookingStatus(`Sorry, only ${availableRooms.length} rooms are available. Cannot book ${numRooms} rooms.`);
      return;
    }

    // Clear previous booking visualization
    const clearedRooms = rooms.map(r => ({ ...r, isBooked: false }));
    setBookingStatus('');

    let bestBooking = null;
    let minTravelTime = Infinity;

    // 2. Priority 1: Find rooms on the same floor
    for (let floor = 1; floor <= 10; floor++) {
      const floorRooms = availableRooms.filter((r) => r.floor === floor);
      if (floorRooms.length >= numRooms) {
        // Find all combinations of `numRooms` on this floor
        for (let i = 0; i <= floorRooms.length - numRooms; i++) {
          const combo = floorRooms.slice(i, i + numRooms);
          const travelTime = calculateTravelTime(combo);

          if (travelTime < minTravelTime) {
            minTravelTime = travelTime;
            bestBooking = combo;
          }
        }
      }
    }

    // 3. If no single floor is available, check multi-floor options
    if (!bestBooking) {
      // This is a complex combinatorial problem. For this assessment, a greedy approach is acceptable.
      // We'll find the best starting room and then find the next closest rooms.
      // A simpler, but effective, strategy for the assessment:
      // Iterate through all possible combinations of available rooms.
      // This is computationally expensive, but acceptable for a small number of rooms.
      const combinations = (arr, k) => {
        if (k === 0) return [[]];
        if (arr.length < k) return [];
        const first = arr[0];
        const rest = arr.slice(1);
        const combosWithoutFirst = combinations(rest, k);
        const combosWithFirst = combinations(rest, k - 1).map(combo => [first, ...combo]);
        return [...combosWithFirst, ...combosWithoutFirst];
      };

      const allPossibleCombos = combinations(availableRooms, numRooms);

      for (const combo of allPossibleCombos) {
        const travelTime = calculateTravelTime(combo);
        if (travelTime < minTravelTime) {
          minTravelTime = travelTime;
          bestBooking = combo;
        }
      }
    }


    if (bestBooking) {
      const roomNumbersToBook = new Set(bestBooking.map(r => r.roomNumber));
      const updatedRooms = clearedRooms.map((room) => {
        if (roomNumbersToBook.has(room.roomNumber)) {
          return { ...room, isOccupied: true, isBooked: true };
        }
        return room;
      });
      setRooms(updatedRooms);
      setBookingStatus(`Successfully booked rooms: ${bestBooking.map(r => r.roomNumber).join(', ')}. Total travel time: ${minTravelTime} minutes.`);
    } else {
      setBookingStatus(`Could not find a suitable combination of ${numRooms} rooms.`);
    }
  };

  const handleRandomOccupancy = () => {
    const updatedRooms = rooms.map(room => ({
      ...room,
      isOccupied: Math.random() > 0.5, // 50% chance of being occupied
      isBooked: false,
    }));
    setRooms(updatedRooms);
    setBookingStatus('Random occupancy has been generated.');
  };

  const handleReset = () => {
    setRooms(generateRooms());
    setBookingStatus('Hotel has been reset. All rooms are now available.');
  };


  return (
    <div className="hotel-container">
      <h1>Hotel Room Reservation</h1>
      <div className="controls">
        <input
          type="number"
          min="1"
          max="5"
          value={numRooms}
          onChange={(e) => setNumRooms(parseInt(e.target.value, 10))}
        />
        <button onClick={handleBooking}>Book</button>
        <button onClick={handleRandomOccupancy}>Randomize Occupancy</button>
        <button onClick={handleReset}>Reset</button>
      </div>
      {bookingStatus && <p className="status-message">{bookingStatus}</p>}
      <div className="hotel-visualization">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((floor) => (
          <div key={floor} className="floor">
            <h3>Floor {floor}</h3>
            <div className="rooms">
              {rooms
                .filter((room) => room.floor === floor)
                .map((room) => (
                  <div
                    key={room.roomNumber}
                    className={`room ${room.isBooked ? 'booked' : room.isOccupied ? 'occupied' : 'available'}`}
                  >
                    {room.roomNumber}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hotel;
