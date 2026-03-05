async function runTests() {
    const BASE_URL = 'http://localhost:5000/api/admin';

    try {
        console.log('1. Adding a new Faculty...');
        const facultyRes = await fetch(`${BASE_URL}/faculty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Engineering',
                color: '#ff0000',
                facultyCode: 'ENG' + Date.now()
            })
        });
        if (!facultyRes.ok) throw new Error(await facultyRes.text());
        const facultyData = await facultyRes.json();
        const facultyId = facultyData._id;
        console.log('Faculty created:', facultyId);

        console.log('\n2. Adding a new Hostel...');
        const hostelRes = await fetch(`${BASE_URL}/hostel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                officialName: 'Test Hostel ' + Date.now(),
                gender: 'Male',
                numberOfFloors: 2
            })
        });
        if (!hostelRes.ok) throw new Error(await hostelRes.text());
        const hostelData = await hostelRes.json();
        const hostelId = hostelData._id;
        console.log('Hostel created:', hostelId);

        console.log('\n3. Designing the Hostel...');
        const designRes = await fetch(`${BASE_URL}/hostel/${hostelId}/design`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                floorConfigs: [3, 4]
            })
        });
        if (!designRes.ok) throw new Error(await designRes.text());
        console.log('Design response:', await designRes.json());

        const mongoose = require('mongoose');
        require('dotenv').config({ path: './.env' });
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostelDB');

        const Room = require('./models/Room');
        const Student = require('./models/Student');

        const rooms = await Room.find({ hostel: hostelId });
        const roomId = rooms[0]._id;
        console.log('\nFound room:', roomId, rooms[0].roomNumber);

        console.log('\n4. Configuring the Room as reserved for Engineering...');
        const configRes = await fetch(`${BASE_URL}/room/${roomId}/configure`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                facultyId: facultyId,
                year: '1',
                capacity: 2
            })
        });
        if (!configRes.ok) throw new Error(await configRes.text());
        const configData = await configRes.json();
        console.log('Room configured:', configData.room.allocation);

        console.log('\n5. Creating a Student directly via Mongoose...');
        const student = new Student({
            name: 'John Doe',
            indexNumber: 'IDX' + Date.now(),
            faculty: facultyId
        });
        await student.save();
        console.log('Student created:', student.indexNumber);

        console.log('\n6. Allocating Student to Room...');
        const allocRes = await fetch(`${BASE_URL}/room/${roomId}/allocate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentIndex: student.indexNumber
            })
        });
        if (!allocRes.ok) throw new Error(await allocRes.text());
        console.log('Allocation Response:', await allocRes.json());

        console.log('\n7. Updating Room Assets...');
        const assetRes = await fetch(`${BASE_URL}/room/${roomId}/assets`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fans: { total: 2, working: 1 }
            })
        });
        if (!assetRes.ok) throw new Error(await assetRes.text());
        const assetData = await assetRes.json();
        console.log('Assets Response:', assetData.assets.fans);

        console.log('\nAll tests passed!');
        process.exit(0);

    } catch (err) {
        console.error('Test Failed:', err.message);
        process.exit(1);
    }
}

runTests();
