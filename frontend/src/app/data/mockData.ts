export interface Train {
  id: string;
  name: string;
  number: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  availability: number;
  totalSeats: number;
  classes: string[];
  type: 'express' | 'superfast' | 'rajdhani' | 'shatabdi' | 'premium' | 'tatkal';
  days: string[];
}

export const mockTrains: Train[] = [
  {
    id: '1',
    name: 'Rajdhani Express',
    number: '12301',
    from: 'New Delhi',
    to: 'Mumbai Central',
    departure: '16:55',
    arrival: '08:35',
    duration: '15h 40m',
    price: 2450,
    availability: 87,
    totalSeats: 200,
    classes: ['1AC', '2AC', '3AC'],
    type: 'rajdhani',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    id: '2',
    name: 'Shatabdi Express',
    number: '12002',
    from: 'New Delhi',
    to: 'Mumbai Central',
    departure: '06:00',
    arrival: '14:30',
    duration: '8h 30m',
    price: 1850,
    availability: 142,
    totalSeats: 200,
    classes: ['CC', 'EC'],
    type: 'shatabdi',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    id: '3',
    name: 'Duronto Express',
    number: '12259',
    from: 'New Delhi',
    to: 'Mumbai Central',
    departure: '22:15',
    arrival: '12:05',
    duration: '13h 50m',
    price: 2100,
    availability: 56,
    totalSeats: 200,
    classes: ['1AC', '2AC', '3AC', 'Sleeper'],
    type: 'superfast',
    days: ['Mon', 'Wed', 'Fri', 'Sun']
  },
  {
    id: '4',
    name: 'August Kranti Express',
    number: '12952',
    from: 'New Delhi',
    to: 'Mumbai Central',
    departure: '17:25',
    arrival: '09:10',
    duration: '15h 45m',
    price: 1450,
    availability: 23,
    totalSeats: 200,
    classes: ['2AC', '3AC', 'Sleeper'],
    type: 'express',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    id: '5',
    name: 'Vande Bharat Express',
    number: '22435',
    from: 'New Delhi',
    to: 'Mumbai Central',
    departure: '07:30',
    arrival: '15:00',
    duration: '7h 30m',
    price: 3250,
    availability: 168,
    totalSeats: 200,
    classes: ['CC', 'EC'],
    type: 'premium',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    id: '6',
    name: 'Garib Rath Express',
    number: '12909',
    from: 'New Delhi',
    to: 'Mumbai Central',
    departure: '14:40',
    arrival: '06:30',
    duration: '15h 50m',
    price: 980,
    availability: 12,
    totalSeats: 200,
    classes: ['3AC', 'Sleeper'],
    type: 'tatkal',
    days: ['Tue', 'Thu', 'Sat']
  }
];

export const cities = [
  'New Delhi',
  'Mumbai Central',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Bhopal'
];

export const popularRoutes = [
  { from: 'New Delhi', to: 'Mumbai Central' },
  { from: 'Bangalore', to: 'Chennai' },
  { from: 'Kolkata', to: 'New Delhi' },
  { from: 'Hyderabad', to: 'Bangalore' },
];
