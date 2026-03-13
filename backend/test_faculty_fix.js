const mongoose = require('mongoose');

async function verifyFacultyFix() {
    const BASE_URL = 'http://localhost:5000/api/admin';

    try {
        console.log('1. Fetching all faculties to get an ID and a Code...');
        const facRes = await fetch(`${BASE_URL}/faculties`);
        const faculties = await facRes.json();

        if (faculties.length === 0) {
            console.log('No faculties found. Please add a faculty first.');
            return;
        }

        const facultyId = faculties[0]._id;
        const facultyCode = faculties[0].facultyCode;
        console.log(`Using Faculty ID: ${facultyId} and Code: ${facultyCode}`);

        console.log('\n2. Fetching a room to update...');
        const hostelRes = await fetch(`${BASE_URL}/hostels`);
        const hostels = await hostelRes.json();
        if (hostels.length === 0) {
            console.log('No hostels found.');
            return;
        }

        const layoutRes = await fetch(`${BASE_URL}/hostel/${hostels[0]._id}/layout`);
        const layoutData = await layoutRes.json();
        const firstRoomId = layoutData.layout["1"].rooms[0]._id;
        console.log(`Using Room ID: ${firstRoomId}`);

        console.log('\n3. Testing update with valid ObjectId...');
        const updateIdRes = await fetch(`${BASE_URL}/room/${firstRoomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ faculty: facultyId, year: 2 })
        });
        const updateIdData = await updateIdRes.json();
        if (updateIdRes.ok) {
            console.log('✅ Update with ObjectId successful');
        } else {
            console.error('❌ Update with ObjectId failed:', updateIdData.message);
        }

        console.log('\n4. Testing update with facultyCode (backward compatibility)...');
        const updateCodeRes = await fetch(`${BASE_URL}/room/${firstRoomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ faculty: facultyCode, year: 3 })
        });
        const updateCodeData = await updateCodeRes.json();
        if (updateCodeRes.ok) {
            console.log('✅ Update with facultyCode successful');
        } else {
            console.error('❌ Update with facultyCode failed:', updateCodeData.message);
        }

        console.log('\nVerification completed!');

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verifyFacultyFix();
