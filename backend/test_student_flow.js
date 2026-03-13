const mongoose = require('mongoose');

async function verifyStudentFlow() {
    const BASE_URL = 'http://localhost:5000/api/admin';

    try {
        console.log('1. Fetching unassigned students...');
        const unassignedRes = await fetch(`${BASE_URL}/students/unassigned`);
        const unassignedStudents = await unassignedRes.json();

        if (unassignedStudents.length === 0) {
            console.log('No unassigned students found. Please ensure students are in the DB with assignedRoom: null');
            return;
        }

        const student = unassignedStudents[0];
        console.log(`Using Student: ${student.name} (${student.indexNumber})`);

        console.log('\n2. Fetching a room to allocate to...');
        const hostelRes = await fetch(`${BASE_URL}/hostels`);
        const hostels = await hostelRes.json();
        if (hostels.length === 0) return console.log('No hostels found.');

        const layoutRes = await fetch(`${BASE_URL}/hostel/${hostels[0]._id}/layout`);
        const layoutData = await layoutRes.json();
        const firstRoom = layoutData.layout["1"].rooms[0];
        console.log(`Using Room: ${firstRoom.roomNumber} (ID: ${firstRoom._id})`);

        console.log(`\n3. Allocating student ${student.indexNumber} to room ${firstRoom.roomNumber}...`);
        const allocRes = await fetch(`${BASE_URL}/room/${firstRoom._id}/allocate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentIndex: student.indexNumber })
        });
        const allocData = await allocRes.json();
        if (allocRes.ok && allocData.room) {
            console.log('✅ Allocation successful and returned updated room');
            console.log(`   Occupants in returned room: ${allocData.room.students.length}`);
        } else {
            console.error('❌ Allocation failed or did not return room:', allocData.message);
            return;
        }

        console.log(`\n4. Unassigning student ${student.name}...`);
        const unassignRes = await fetch(`${BASE_URL}/student/${student._id}/unassign`, {
            method: 'PUT'
        });
        const unassignData = await unassignRes.json();
        if (unassignRes.ok) {
            console.log('✅ Unassignment successful');
            if (unassignData.room) {
                console.log('✅ Unassignment returned updated room');
                console.log(`   Occupants in returned room: ${unassignData.room.students.length}`);
            }
        } else {
            console.error('❌ Unassignment failed:', unassignData.message);
        }

        console.log('\n5. Final verification: Layout should be empty again...');
        const finalRes = await fetch(`${BASE_URL}/hostel/${hostels[0]._id}/layout`);
        const finalData = await finalRes.json();
        const finalRoom = finalData.layout["1"].rooms.find(r => r._id === firstRoom._id);
        if (finalRoom.students.length === 0) {
            console.log('✅ Final layout verification: Room is empty');
        } else {
            console.error('❌ Final verification failed: Room still has students');
        }

        console.log('\nVerification completed!');

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verifyStudentFlow();
