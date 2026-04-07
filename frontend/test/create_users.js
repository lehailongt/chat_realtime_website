import axios from 'axios';

// Cấu hình API endpoint - thay đổi theo backend của bạn
const API_URL = 'http://localhost:5001/api/auth/signup';

// Hàm tạo user mới
async function createUser(username, password, email, firstName, lastName) {
    try {
        const response = await axios.post(API_URL, {
            username: username,
            password: password,
            email: email,
            firstName: firstName,
            lastName: lastName
        });
        console.log(`✅ Success: ${username} - ${email}`);
        console.log(`   Response:`, response.data);
        return true;
    } catch (error) {
        console.error(`❌ Error creating ${username}:`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message:`, error.response.data);
        } else {
            console.error(`   Message:`, error.message);
        }
        return false;
    }
}

// Hàm tạo danh sách users từ 7 đến 20
async function createUsers() {
    console.log('🚀 Starting to create users 7 to 20...\n');
    
    const users = [];
    for (let i = 7; i <= 20; i++) {
        users.push({
            username: `user${i}`,
            password: '123456',
            email: `user${i}@gmail.com`,
            firstName: `FirstName${i}`,
            lastName: `LastName${i}`
        });
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Tạo từng user một (có thể thay đổi thành Promise.all để tạo đồng thời)
    for (const user of users) {
        const success = await createUser(
            user.username,
            user.password,
            user.email,
            user.firstName,
            user.lastName
        );
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // Delay 0.5s giữa các request để tránh quá tải server
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Success: ${successCount} users`);
    console.log(`   ❌ Failed: ${failCount} users`);
    console.log(`   📝 Total: ${users.length} users`);
}

// Chạy script
createUsers().catch(error => {
    console.error('Unexpected error:', error);
});