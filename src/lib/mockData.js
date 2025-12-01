// Global mock data for demo purposes
if (!global.mockData) {
  global.mockData = {
    users: [],
    prizes: [
      { _id: '1', name: 'Mystery Box', description: 'Kotak misteri dengan hadiah kejutan', color: '#FF6B6B', probability: 10, isActive: true },
      { _id: '2', name: 'Voucher 50K', description: 'Voucher belanja senilai Rp 50.000', color: '#4ECDC4', probability: 15, isActive: true },
      { _id: '3', name: 'Merchandise', description: 'Merchandise eksklusif brand', color: '#45B7D1', probability: 20, isActive: true },
      { _id: '4', name: 'Voucher 100K', description: 'Voucher belanja senilai Rp 100.000', color: '#96CEB4', probability: 10, isActive: true },
      { _id: '5', name: 'Grand Prize', description: 'Hadiah utama spesial', color: '#FFEAA7', probability: 5, isActive: true },
      { _id: '6', name: 'Thank You', description: 'Terima kasih telah berpartisipasi', color: '#DDA0DD', probability: 25, isActive: true },
      { _id: '7', name: 'Voucher 25K', description: 'Voucher belanja senilai Rp 25.000', color: '#98D8C8', probability: 10, isActive: true },
      { _id: '8', name: 'Special Gift', description: 'Hadiah spesial dari brand', color: '#FFB6C1', probability: 5, isActive: true }
    ],
    spinResults: [],
    assignedPrizes: {},
    userIdCounter: 0,
    spinResultCounter: 1
  }
}

export const mockData = global.mockData