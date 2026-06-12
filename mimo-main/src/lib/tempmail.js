import axios from 'axios';

export const tempmail = {
  create: async () => {
    try {
      const config = {
        method: 'POST',
        url: 'https://tempail.top/api/email/create/ApiTempail',
        headers: {
          'User-Agent': 'ScRaPe/9.9 (KaliLinux; Nusantara Os; My/Shannz)',
          'Connection': 'Keep-Alive',
          'Accept-Encoding': 'gzip',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': '0'
        }
      };

      const response = await axios.request(config);
      return { success: true, code: 200, result: response.data };
    } catch (error) {
      console.error('Error create email:', error.message);
      throw new Error('Gagal membuat email temporer');
    }
  },
  
  cekInbox: async (token) => {
    if (!token || typeof token !== 'string') {
      throw new Error('Token diperlukan');
    }

    try {
      const config = {
        method: 'GET',
        url: `https://tempail.top/api/messages/${token}/ApiTempail`,
        headers: {
          'User-Agent': 'ScRaPe/9.9 (KaliLinux; Nusantara Os; My/Shannz)',
          'Connection': 'Keep-Alive',
          'Accept-Encoding': 'gzip'
        }
      };

      const response = await axios.request(config);
      return { success: true, code: 200, result: response.data };
    } catch (error) {
      console.error('Error cek inbox:', error.message);
      throw new Error('Gagal mengambil pesan');
    }
  }
};