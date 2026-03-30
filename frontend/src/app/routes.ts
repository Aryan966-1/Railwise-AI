import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { TrainList } from './pages/TrainList';
import { SeatSelection } from './pages/SeatSelection';
import { PassengerDetails } from './pages/PassengerDetails';
import { Payment } from './pages/Payment';
import { Confirmation } from './pages/Confirmation';
import { MyBookings } from './pages/MyBookings';
import { RootLayout } from './components/layout/RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'trains', Component: TrainList },
      { path: 'seats', Component: SeatSelection },
      { path: 'passengers', Component: PassengerDetails },
      { path: 'payment', Component: Payment },
      { path: 'confirmation', Component: Confirmation },
      { path: 'my-bookings', Component: MyBookings },
    ],
  },
]);
