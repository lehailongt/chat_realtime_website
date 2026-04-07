import axios from 'axios';

// Cấu hình API
const API_URL = 'http://localhost:5001/api';
const LOGIN_URL = `${API_URL}/auth/signin`;
const FRIEND_REQUEST_URL = `${API_URL}/friends/requests`;
// Backend sử dụng path parameter: /friends/requests/:requestId
const ACCEPT_REQUEST_URL = (requestId) => `${API_URL}/friends/requests/${requestId}`;

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
        
        // Kiểm tra accessToken từ response
        if (response.data && response.data.accessToken) {
            console.log(`✅ Đăng nhập thành công: ${username}`);
            return response.data.accessToken;
        }
        console.log(`❌ Không nhận được accessToken cho ${username}`);
        return null;
    } catch (error) {
        console.error(`❌ Đăng nhập thất bại: ${username}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data.message || 'Lỗi không xác định'}`);
        }
        return null;
    }
}

/**
 * Lấy danh sách lời mời kết bạn đã nhận
 * Backend trả về: { sent: [], received: [] }
 */
async function getReceivedRequests(token) {
    try {
        const response = await axios.get(FRIEND_REQUEST_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.received) {
            console.log(`   📥 Tìm thấy ${response.data.received.length} lời mời đã nhận`);
            return response.data.received;
        }
        return [];
    } catch (error) {
        console.error('   ❌ Lỗi khi lấy danh sách lời mời:');
        if (error.response) {
            console.error(`      Status: ${error.response.status}`);
            console.error(`      Message: ${error.response.data.message}`);
        }
        return [];
    }
}

/**
 * Chấp nhận một lời mời kết bạn
 * Backend sử dụng method: PUT /api/friends/requests/:requestId
 */
async function acceptFriendRequest(token, requestId, fromUser) {
    try {
        // Sửa: Backend dùng PUT, không phải /accept
        const response = await axios.put(
            ACCEPT_REQUEST_URL(requestId),
            {}, // Body rỗng vì backend không cần data
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Đã chấp nhận lời mời từ: ${fromUser?.username || fromUser?._id}`);
        if (response.data && response.data.newFriend) {
            console.log(`      👥 Đã kết bạn với: ${response.data.newFriend.displayName}`);
        }
        return true;
    } catch (error) {
        console.error(`   ❌ Lỗi khi chấp nhận lời mời từ: ${fromUser?.username || fromUser?._id}`);
        if (error.response) {
            console.error(`      Status: ${error.response.status}`);
            console.error(`      Message: ${error.response.data.message || 'Lỗi không xác định'}`);
            
            // Xử lý các trường hợp lỗi cụ thể
            if (error.response.status === 403) {
                console.error(`      ⚠️ Bạn không có quyền chấp nhận lời mời này`);
            } else if (error.response.status === 404) {
                console.error(`      ⚠️ Không tìm thấy lời mời`);
            }
        }
        return false;
    }
}

/**
 * Từ chối lời mời kết bạn (nếu cần)
 */
async function declineFriendRequest(token, requestId, fromUser) {
    try {
        const response = await axios.delete(
            ACCEPT_REQUEST_URL(requestId),
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Đã từ chối lời mời từ: ${fromUser?.username || fromUser?._id}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Lỗi khi từ chối lời mời từ: ${fromUser?.username || fromUser?._id}`);
        if (error.response) {
            console.error(`      Status: ${error.response.status}`);
            console.error(`      Message: ${error.response.data.message}`);
        }
        return false;
    }
}

/**
 * Chấp nhận tất cả lời mời kết bạn cho một user
 */
async function acceptAllFriendRequestsForUser(username, password) {
   
    // 1. Đăng nhập
    const token = await loginAndGetToken(username, password);
    
    if (!token) {
        console.error(`❌ Không thể tiếp tục vì đăng nhập thất bại cho ${username}`);
        return;
    }
    
    // 2. Lấy danh sách lời mời đã nhận
    console.log('\n📋 Đang lấy danh sách lời mời kết bạn đã nhận...');
    const receivedRequests = await getReceivedRequests(token);
    
    if (receivedRequests.length === 0) {
        console.log('\n✨ Không có lời mời kết bạn nào để chấp nhận!');
        return;
    }
    
    // 3. Hiển thị danh sách lời mời
    console.log('\n📋 DANH SÁCH LỜI MỜI ĐÃ NHẬN:');
    receivedRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. Từ: ${req.from?.username || req.from?.displayName}`);
        console.log(`      ID: ${req.from?._id}`);
        console.log(`      Tin nhắn: ${req.message || 'Không có'}`);
        console.log(`      Request ID: ${req._id}\n`);
    });
    
    // 4. Chấp nhận từng lời mời
    console.log('\n🔄 Đang chấp nhận lời mời...\n');
    
    let successCount = 0;
    let failCount = 0;
    const failedRequests = [];
    
    for (const request of receivedRequests) {
        console.log(`📤 Đang xử lý lời mời từ: ${request.from?.username || request.from?._id}`);
        
        const success = await acceptFriendRequest(token, request._id, request.from);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
            failedRequests.push(request.from?.username || request.from?._id);
        }
        
        // Delay 0.5s giữa các request
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 5. Kết quả
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ CHẤP NHẬN LỜI MỜI:');
    console.log('='.repeat(60));
    console.log(`   ✅ Thành công: ${successCount} lời mời`);
    console.log(`   ❌ Thất bại: ${failCount} lời mời`);
    console.log(`   📝 Tổng số: ${receivedRequests.length} lời mời`);
    
    if (failedRequests.length > 0) {
        console.log(`\n⚠️ Danh sách lời mời thất bại từ: ${failedRequests.join(', ')}`);
    }
    console.log('='.repeat(60));
}

/**
 * Kiểm tra danh sách bạn bè
 */
async function checkFriendsList(username, password) {
    console.log('\n🔍 KIỂM TRA DANH SÁCH BẠN BÈ...\n');
    
    const token = await loginAndGetToken(username, password);
    
    if (!token) {
        console.error('❌ Không thể kiểm tra danh sách bạn bè');
        return;
    }
    
    try {
        const response = await axios.get(`${API_URL}/friends`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const friends = response.data.friends || [];
        
        console.log('📊 THỐNG KÊ BẠN BÈ:');
        console.log(`   👥 Tổng số bạn bè: ${friends.length}`);
        
        if (friends.length > 0) {
            console.log('\n📋 DANH SÁCH BẠN BÈ:');
            friends.forEach((friend, index) => {
                console.log(`   ${index + 1}. ${friend.displayName || friend.username}`);
                console.log(`      ID: ${friend._id}`);
                console.log(`      Username: ${friend.username}`);
                console.log(`      Avatar: ${friend.avatarUrl || 'Không có'}\n`);
            });
        } else {
            console.log('\n✨ Chưa có bạn bè nào!');
        }
        
    } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách bạn bè:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data.message}`);
        }
    }
}

/**
 * Chấp nhận lời mời song song (nhanh hơn)
 */
async function acceptRequestsParallel(username, password) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 CHẤP NHẬN LỜI MỜI SONG SONG CHO: ${username}`);
    console.log('='.repeat(60));
    
    const token = await loginAndGetToken(username, password);
    
    if (!token) {
        console.error(`❌ Không thể tiếp tục vì đăng nhập thất bại`);
        return;
    }
    
    const receivedRequests = await getReceivedRequests(token);
    
    if (receivedRequests.length === 0) {
        console.log('\n✨ Không có lời mời nào!');
        return;
    }
    
    console.log(`\n📋 Tìm thấy ${receivedRequests.length} lời mời. Đang xử lý song song...\n`);
    
    // Gửi tất cả request chấp nhận cùng lúc
    const promises = receivedRequests.map(request => 
        acceptFriendRequest(token, request._id, request.from)
    );
    
    const results = await Promise.allSettled(promises);
    
    let successCount = 0;
    let failCount = 0;
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value === true) {
            successCount++;
            console.log(`   ✅ Thành công: ${receivedRequests[index].from?.username}`);
        } else {
            failCount++;
            console.log(`   ❌ Thất bại: ${receivedRequests[index].from?.username}`);
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ:');
    console.log('='.repeat(60));
    console.log(`   ✅ Thành công: ${successCount} lời mời`);
    console.log(`   ❌ Thất bại: ${failCount} lời mời`);
    console.log('='.repeat(60));
}

/**
 * Chấp nhận lời mời từ các user cụ thể đến một user
 */
async function acceptRequestsFromSpecificUsers(targetUsername, targetPassword, sourceUsernames) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 CHẤP NHẬN LỜI MỜI TỪ CÁC USER CỤ THỂ ĐẾN: ${targetUsername}`);
    console.log('='.repeat(60));
    
    const token = await loginAndGetToken(targetUsername, targetPassword);
    
    if (!token) {
        console.error(`❌ Không thể tiếp tục vì đăng nhập thất bại`);
        return;
    }
    
    const receivedRequests = await getReceivedRequests(token);
    
    if (receivedRequests.length === 0) {
        console.log('\n✨ Không có lời mời nào!');
        return;
    }
    
    // Lọc chỉ chấp nhận lời mời từ các user trong danh sách sourceUsernames
    const requestsToAccept = receivedRequests.filter(request => 
        sourceUsernames.includes(request.from?.username)
    );
    
    console.log(`\n📋 Tìm thấy ${requestsToAccept.length} lời mời từ các user đã chỉ định:`);
    requestsToAccept.forEach((req, index) => {
        console.log(`   ${index + 1}. Từ: ${req.from?.username}`);
        console.log(`      Message: ${req.message || 'Không có'}\n`);
    });
    
    if (requestsToAccept.length === 0) {
        console.log('✨ Không có lời mời từ các user đã chỉ định!');
        return;
    }
    
    console.log('🔄 Đang chấp nhận lời mời...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const request of requestsToAccept) {
        console.log(`📤 Chấp nhận lời mời từ: ${request.from?.username}`);
        
        const success = await acceptFriendRequest(token, request._id, request.from);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ:');
    console.log('='.repeat(60));
    console.log(`   ✅ Thành công: ${successCount} lời mời`);
    console.log(`   ❌ Thất bại: ${failCount} lời mời`);
    console.log('='.repeat(60));
}

// ==================== MAIN ====================
async function main() {
    console.log('='.repeat(60));
    console.log('🚀 CHƯƠNG TRÌNH CHẤP NHẬN LỜI MỜI KẾT BẠN');
    console.log('='.repeat(60));
    
    // CÁCH 1: Chấp nhận TẤT CẢ lời mời cho user10 (từ user1, user2, user3,...)
    await acceptAllFriendRequestsForUser('user1', '123456');
    
    // CÁCH 2: Chấp nhận lời mời từ các user cụ thể đến user10
    // await acceptRequestsFromSpecificUsers(
    //     'user10',           // target user
    //     '123456',           // password
    //     ['user1', 'user2', 'user3', 'user4', 'user5']  // source users
    // );
    
    // CÁCH 3: Chấp nhận lời mời song song (nhanh hơn)
    // await acceptRequestsParallel('user10', '123456');
    
    // Kiểm tra danh sách bạn bè sau khi chấp nhận
    await checkFriendsList('user1', '123456');
}

// Chạy script
main().catch(console.error);