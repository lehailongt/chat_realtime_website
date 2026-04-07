import axios from 'axios';

// Cấu hình API
const API_URL = 'http://localhost:5001/api';
const LOGIN_URL = `${API_URL}/auth/signin`;
const FRIEND_REQUEST_URL = `${API_URL}/friends/requests`;
const SEARCH_USER_URL = `${API_URL}/users/search`;

/**
 * Đăng nhập và lấy token
 */
async function loginAndGetToken(username, password) {
    try {
        const response = await axios.post(LOGIN_URL, {
            username: username,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.accessToken) {
            console.log('✅ Đăng nhập thành công');
            return response.data.accessToken;
        }
        console.log('❌ Không nhận được accessToken từ server');
        return null;
    } catch (error) {
        console.error('❌ Đăng nhập thất bại:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data.message || 'Lỗi không xác định'}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        return null;
    }
}

/**
 * Gửi lời mời kết bạn
 */
async function sendFriendRequest(token, toUserId, message = '') {
    try {
        const response = await axios.post(FRIEND_REQUEST_URL, {
            to: toUserId,
            message: message
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`   ✅ Gửi lời mời thành công đến ID: ${toUserId}`);
        if (response.data && response.data.message) {
            console.log(`   📨 Phản hồi: ${response.data.message}`);
        }
        return true;
    } catch (error) {
        console.error(`   ❌ Gửi lời mời thất bại đến ID: ${toUserId}`);
        if (error.response) {
            console.error(`      Status: ${error.response.status}`);
            console.error(`      Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
            
            // Xử lý các trường hợp đặc biệt
            if (error.response.status === 400) {
                if (error.response.data.message === "Hai người đã là bạn bè") {
                    console.error(`      ⚠️ Đã là bạn bè rồi!`);
                } else if (error.response.data.message === "Đã có lời mời kết bạn đang chờ") {
                    console.error(`      ⚠️ Đã có lời mời đang chờ!`);
                }
            }
        } else if (error.request) {
            console.error(`      Không nhận được phản hồi từ server`);
        } else {
            console.error(`      Error: ${error.message}`);
        }
        return false;
    }
}

/**
 * Lấy userId từ username (ĐÃ SỬA)
 */
async function getUserIdByUsername(token, username) {
    try {
        const response = await axios.get(`${SEARCH_USER_URL}?username=${username}`, {
            headers: {
                'Authorization': `Bearer ${token}`, // QUAN TRỌNG: Phải có token
                'Content-Type': 'application/json'
            }
        });
        
        // SỬA: response.data.user (không phải response.user)
        if (response.data && response.data.user && response.data.user._id) {
            console.log(`   📝 Tìm thấy ${username} với ID: ${response.data.user._id}`);
            return response.data.user._id;
        }
        
        console.log(`   ⚠️ Không tìm thấy user: ${username}`);
        return null;
    } catch (error) {
        console.error(`   ❌ Lỗi khi tìm user: ${username}`);
        if (error.response) {
            console.error(`      Status: ${error.response.status}`);
            console.error(`      Message: ${error.response.data.message || 'User not found'}`);
        } else if (error.request) {
            console.error(`      Không nhận được phản hồi từ server`);
        } else {
            console.error(`      Error: ${error.message}`);
        }
        return null;
    }
}

/**
 * Gửi lời mời đến nhiều users
 */
async function sendRequestsToMultipleUsers() {
    console.log('🚀 Bắt đầu gửi lời mời kết bạn đến nhiều users...\n');
    
    // 1. Đăng nhập
    const token = await loginAndGetToken('user1', '123456');
    
    if (!token) {
        console.error('❌ Không thể tiếp tục vì đăng nhập thất bại');
        return;
    }
    
    // 2. Danh sách username cần gửi lời mời
    const targetUsernames = ['user2', 'user3', 'user4', 'user5', 'user6', 
                             'user7', 'user8', 'user9', 'user10'];
    
    console.log(`📋 Danh sách cần gửi: ${targetUsernames.join(', ')}\n`);
    
    let successCount = 0;
    let failCount = 0;
    const failedUsers = [];
    
    for (const username of targetUsernames) {
        console.log(`\n📤 Đang xử lý: ${username}`);
        
        // Lấy userId từ username (truyền token vào)
        const userId = await getUserIdByUsername(token, username);
        
        if (!userId) {
            console.log(`   ❌ Bỏ qua: Không tìm thấy user ${username}`);
            failCount++;
            failedUsers.push(username);
            continue;
        }
        
        // Gửi lời mời
        const success = await sendFriendRequest(
            token, 
            userId, 
            `Lời mời kết bạn từ user1`
        );
        
        if (success) {
            successCount++;
        } else {
            failCount++;
            failedUsers.push(username);
        }
        
        // Delay để tránh quá tải
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 KẾT QUẢ:');
    console.log('='.repeat(50));
    console.log(`   ✅ Thành công: ${successCount}`);
    console.log(`   ❌ Thất bại: ${failCount}`);
    console.log(`   📝 Tổng số: ${targetUsernames.length}`);
    
    if (failedUsers.length > 0) {
        console.log(`\n⚠️ Danh sách users thất bại: ${failedUsers.join(', ')}`);
    }
    console.log('='.repeat(50));
}

/**
 * Gửi lời mời đến user3 với message "user7"
 */
async function sendRequestToUser3() {
    console.log('🚀 Gửi lời mời đến user3 với message "user7"\n');
    
    const token = await loginAndGetToken('user1', '123456');
    
    if (!token) {
        console.error('❌ Không thể tiếp tục vì đăng nhập thất bại');
        return;
    }
    
    const user3Id = await getUserIdByUsername(token, 'user3');
    
    if (!user3Id) {
        console.error('❌ Không tìm thấy user3');
        return;
    }
    
    console.log(`\n📤 Đang gửi lời mời đến user3 với message "user7"...\n`);
    await sendFriendRequest(token, user3Id, 'user7');
}

/**
 * Gửi lời mời đến tất cả users từ user2 đến user20
 */
async function sendRequestsToAllUsers() {
    console.log('🚀 Gửi lời mời đến tất cả users (user2 - user20)\n');
    
    const token = await loginAndGetToken('user1', '123456');
    
    if (!token) {
        console.error('❌ Không thể tiếp tục vì đăng nhập thất bại');
        return;
    }
    
    // Tạo danh sách user2 đến user20
    const targetUsernames = [];
    for (let i = 2; i <= 20; i++) {
        targetUsernames.push(`user${i}`);
    }
    
    console.log(`📋 Sẽ gửi đến ${targetUsernames.length} users\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const username of targetUsernames) {
        console.log(`\n📤 Đang xử lý: ${username}`);
        
        const userId = await getUserIdByUsername(token, username);
        
        if (!userId) {
            console.log(`   ❌ Không tìm thấy ${username}`);
            failCount++;
            continue;
        }
        
        const success = await sendFriendRequest(token, userId, `Lời mời kết bạn từ user1`);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 KẾT QUẢ:');
    console.log('='.repeat(50));
    console.log(`   ✅ Thành công: ${successCount}`);
    console.log(`   ❌ Thất bại: ${failCount}`);
    console.log(`   📝 Tổng số: ${targetUsernames.length}`);
    console.log('='.repeat(50));
}

/**
 * Kiểm tra danh sách lời mời đã gửi
 */
async function checkFriendRequests() {
    console.log('\n🔍 Kiểm tra danh sách lời mời...\n');
    
    const token = await loginAndGetToken('user1', '123456');
    
    if (!token) {
        console.error('❌ Không thể kiểm tra');
        return;
    }
    
    try {
        const response = await axios.get(FRIEND_REQUEST_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 THỐNG KÊ:');
        console.log(`   📤 Đã gửi: ${response.data.sent.length} lời mời`);
        console.log(`   📥 Đã nhận: ${response.data.received.length} lời mời`);
        
        if (response.data.sent.length > 0) {
            console.log('\n📤 LỜI MỜI ĐÃ GỬI:');
            response.data.sent.forEach((req, index) => {
                console.log(`   ${index + 1}. Đến: ${req.to?.username || req.to?.displayName || req.to?._id}`);
                console.log(`      Tin nhắn: ${req.message || 'Không có'}`);
                console.log(`      Trạng thái: Đang chờ\n`);
            });
        }
        
        if (response.data.received.length > 0) {
            console.log('\n📥 LỜI MỜI NHẬN ĐƯỢC:');
            response.data.received.forEach((req, index) => {
                console.log(`   ${index + 1}. Từ: ${req.from?.username || req.from?.displayName || req.from?._id}`);
                console.log(`      Tin nhắn: ${req.message || 'Không có'}\n`);
            });
        }
        
    } catch (error) {
        console.error('❌ Lỗi khi kiểm tra:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Message:', error.response.data);
        } else {
            console.error('   Error:', error.message);
        }
    }
}

/**
 * Gửi lời mời song song (nhanh hơn)
 */
async function sendRequestsParallel() {
    console.log('🚀 Gửi lời mời song song (parallel)...\n');
    
    const token = await loginAndGetToken('user1', '123456');
    
    if (!token) {
        console.error('❌ Không thể tiếp tục');
        return;
    }
    
    const targetUsernames = ['user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
    
    // Lấy tất cả userId trước
    console.log('📝 Đang lấy userId cho tất cả users...\n');
    const userPromises = targetUsernames.map(username => getUserIdByUsername(token, username));
    const userIds = await Promise.all(userPromises);
    
    // Lọc user hợp lệ
    const validUsers = [];
    for (let i = 0; i < targetUsernames.length; i++) {
        if (userIds[i]) {
            validUsers.push({
                username: targetUsernames[i],
                userId: userIds[i]
            });
        }
    }
    
    console.log(`📤 Đang gửi ${validUsers.length} lời mời đồng thời...\n`);
    
    // Gửi tất cả cùng lúc
    const sendPromises = validUsers.map(user => 
        sendFriendRequest(token, user.userId, `Lời mời kết bạn từ user1 (song song)`)
    );
    
    const results = await Promise.allSettled(sendPromises);
    
    let successCount = 0;
    let failCount = 0;
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value === true) {
            successCount++;
            console.log(`   ✅ ${validUsers[index].username}`);
        } else {
            failCount++;
            console.log(`   ❌ ${validUsers[index].username}`);
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 KẾT QUẢ:');
    console.log('='.repeat(50));
    console.log(`   ✅ Thành công: ${successCount}`);
    console.log(`   ❌ Thất bại: ${failCount}`);
    console.log('='.repeat(50));
}

// ==================== MAIN ====================
async function main() {
    console.log('='.repeat(60));
    console.log('🚀 CHƯƠNG TRÌNH GỬI LỜI MỜI KẾT BẠN');
    console.log('='.repeat(60));
    console.log();
    
    // Chọn chức năng muốn chạy:
    
    // 1. Gửi lời mời đến user3 với message "user7"
    // await sendRequestToUser3();
    
    // 2. Gửi lời mời đến nhiều users (user2 - user10)
    // await sendRequestsToMultipleUsers();
    
    // 3. Gửi lời mời đến tất cả users (user2 - user20)
    await sendRequestsToAllUsers();
    
    // 4. Gửi song song (nhanh hơn)
    // await sendRequestsParallel();
    
    // Kiểm tra kết quả
    await checkFriendRequests();
}

// Chạy script
main().catch(console.error);