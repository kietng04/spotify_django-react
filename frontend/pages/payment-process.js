import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PaymentProcess() {
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [message, setMessage] = useState('Đang xử lý thanh toán...');

  useEffect(() => {
    if (!router.isReady) return;
    
    const validatePayment = async () => {
      try {
        // Get payment data from URL
        const paymentData = router.query;
        const backendVerified = paymentData.backend_verified === 'true';
        
        if (!backendVerified) {
          setMessage('Xác thực thanh toán thất bại!');
          setTimeout(() => {
            router.push('/payment-failed?error=invalid_checksum');
          }, 2000);
          return;
        }

        // Get user token from localStorage
        const userDataString = localStorage.getItem('spotify_user');
        if (!userDataString) {
          setMessage('Không tìm thấy thông tin đăng nhập!');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }

        const userData = JSON.parse(userDataString);
        const token = userData.token;

        // Send verification to backend using fetch instead of axios
        const response = await fetch('http://localhost:8000/api/verify-payment/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
          // Update local user data if needed
          setMessage('Thanh toán thành công! Đang chuyển hướng...');
          setTimeout(() => {
            router.push(`/payment-success?order_id=${paymentData.apptransid}`);
          }, 2000);
        } else {
          setMessage('Xác thực thanh toán thất bại!');
          setTimeout(() => {
            router.push(`/payment-failed?error=${data.message || 'unknown_error'}`);
          }, 2000);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setMessage('Đã xảy ra lỗi khi xác thực thanh toán!');
        setTimeout(() => {
          router.push('/payment-failed?error=server_error');
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    validatePayment();
  }, [router.isReady, router.query]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Xử lý thanh toán</h1>
        <p className="mb-4">{message}</p>
        {processing && (
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        )}
      </div>
    </div>
  );
}