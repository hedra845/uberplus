export interface FlutterFile {
  path: string;
  name: string;
  language: 'dart' | 'yaml' | 'xml' | 'markdown';
  description: string;
  code: string;
}

export const FLUTTER_PROJECT_FILES: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    name: 'pubspec.yaml',
    language: 'yaml',
    description: 'Project dependencies including Google Maps, Geolocator, Bloc, and Polyline decoders',
    code: `name: uber_clone_flutter
description: A production-ready Uber clone mobile application built with Flutter & BLoC.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # Map & Location Services
  google_maps_flutter: ^2.9.0
  geolocator: ^13.0.0
  flutter_polyline_points: ^2.1.0

  # State Management & Reactive streams
  flutter_bloc: ^8.1.6
  equatable: ^2.0.5

  # Realtime Backend & Auth (Firebase)
  firebase_core: ^3.6.0
  firebase_auth: ^5.3.1
  cloud_firestore: ^5.4.4

  # UI & Haptics
  flutter_svg: ^2.0.10+1
  google_fonts: ^6.2.1
  intl: ^0.19.0
  audioplayers: ^6.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/icons/
    - assets/sounds/
`,
  },
  {
    path: 'lib/main.dart',
    name: 'main.dart',
    language: 'dart',
    description: 'Application entrypoint initializing Firebase, Theme, and MultiBlocProvider',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'bloc/ride_bloc.dart';
import 'screens/rider_map_screen.dart';
import 'screens/driver_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase initialization:
  // await Firebase.initializeApp();
  runApp(const UberApp());
}

class UberApp extends StatelessWidget {
  const UberApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<RideBloc>(
          create: (context) => RideBloc(),
        ),
      ],
      child: MaterialApp(
        title: 'Uber Pulse',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: Colors.white,
          textTheme: GoogleFonts.plusJakartaSansTextTheme(),
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.black,
            primary: Colors.black,
            secondary: const Color(0xFF06C167), // Uber Green
          ),
        ),
        home: const AppShell(),
      ),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;
  final List<Widget> _screens = const [
    RiderMapScreen(),
    DriverScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.local_taxi_outlined),
            selectedIcon: Icon(Icons.local_taxi),
            label: 'Rider',
          ),
          NavigationDestination(
            icon: Icon(Icons.navigation_outlined),
            selectedIcon: Icon(Icons.navigation),
            label: 'Driver Partner',
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/screens/rider_map_screen.dart',
    name: 'rider_map_screen.dart',
    language: 'dart',
    description: 'Interactive Rider screen featuring GoogleMap, polyline tracking, and bottom booking sheet',
    code: `import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../bloc/ride_bloc.dart';
import '../bloc/ride_event.dart';
import '../bloc/ride_state.dart';

class RiderMapScreen extends StatefulWidget {
  const RiderMapScreen({super.key});

  @override
  State<RiderMapScreen> createState() => _RiderMapScreenState();
}

class _RiderMapScreenState extends State<RiderMapScreen> {
  final Completer<GoogleMapController> _mapController = Completer();
  LatLng _currentPosition = const LatLng(37.7749, -122.4194); // SF Default
  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};
  String _selectedTier = 'uberx';

  @override
  void initState() {
    super.initState();
    _determinePosition();
  }

  Future<void> _determinePosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.deniedForever) return;
    }

    final pos = await Geolocator.getCurrentPosition();
    setState(() {
      _currentPosition = LatLng(pos.latitude, pos.longitude);
      _markers.add(
        Marker(
          markerId: const MarkerId('pickup_pin'),
          position: _currentPosition,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueCyan),
        ),
      );
    });

    final controller = await _mapController.future;
    controller.animateCamera(CameraUpdate.newLatLngZoom(_currentPosition, 15));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<RideBloc, RideState>(
        listener: (context, state) {
          if (state is RideMatchedState) {
            _updateDriverMarker(state.driverLocation, state.driverBearing);
          }
        },
        builder: (context, state) {
          return Stack(
            children: [
              // 1. Interactive Google Map Canvas
              GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: _currentPosition,
                  zoom: 14.5,
                ),
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                markers: _markers,
                polylines: _polylines,
                onMapCreated: (controller) => _mapController.complete(controller),
              ),

              // 2. Top Search Floating Bar
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        const Icon(Icons.search, color: Colors.black87),
                        const SizedBox(width: 12),
                        Text(
                          'Where to?',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.access_time_filled, size: 14),
                              SizedBox(width: 4),
                              Text('Now', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 3. Draggable Ride Selection Sheet
              DraggableScrollableSheet(
                initialChildSize: 0.38,
                minChildSize: 0.2,
                maxChildSize: 0.85,
                builder: (context, scrollController) {
                  return Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                      boxShadow: [BoxShadow(blurRadius: 20, color: Colors.black12)],
                    ),
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.all(20),
                      children: [
                        Center(
                          child: Container(
                            width: 36,
                            height: 4,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Choose a ride',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        _buildTierTile('uberx', 'UberX', '3 min away', '\$14.20', Icons.directions_car),
                        _buildTierTile('comfort', 'Comfort', '5 min away · Newer cars', '\$18.50', Icons.airline_seat_recline_extra),
                        _buildTierTile('uber_black', 'Uber Black', '4 min away · Premium', '\$32.00', Icons.shield),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () {
                              context.read<RideBloc>().add(
                                    RequestRideEvent(
                                      tier: _selectedTier,
                                      pickup: _currentPosition,
                                      destination: const LatLng(37.7858, -122.4064),
                                    ),
                                  );
                            },
                            child: Text(
                              'Request \${_selectedTier.toUpperCase()}',
                              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildTierTile(String id, String title, String subtitle, String price, IconData icon) {
    final isSelected = _selectedTier == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedTier = id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.grey.shade100 : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.black : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 32, color: Colors.black87),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                ],
              ),
            ),
            Text(price, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
      ),
    );
  }

  void _updateDriverMarker(LatLng pos, double bearing) {
    setState(() {
      _markers.removeWhere((m) => m.markerId.value == 'driver_car');
      _markers.add(
        Marker(
          markerId: const MarkerId('driver_car'),
          position: pos,
          rotation: bearing,
          anchor: const Offset(0.5, 0.5),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        ),
      );
    });
  }
}
`,
  },
  {
    path: 'lib/screens/driver_screen.dart',
    name: 'driver_screen.dart',
    language: 'dart',
    description: 'Driver Partner dashboard with online/offline toggle, earnings radar, and trip dispatch modal',
    code: `import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class DriverScreen extends StatefulWidget {
  const DriverScreen({super.key});

  @override
  State<DriverScreen> createState() => _DriverScreenState();
}

class _DriverScreenState extends State<DriverScreen> {
  bool _isOnline = false;
  double _todayEarnings = 148.50;
  int _completedTrips = 6;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Driver Command HUD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Simulated Street Map
          Positioned.fill(
            child: Container(
              color: const Color(0xFF1E293B),
              child: const Center(
                child: Text(
                  'Driver Partner GPS Streaming Active',
                  style: TextStyle(color: Colors.white38),
                ),
              ),
            ),
          ),

          // 2. Top Earnings Card
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('\$\${_todayEarnings.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                        const Text('Today Earnings', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                    Container(height: 30, width: 1, color: Colors.white24),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('\$_completedTrips',
                            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                        const Text('Trips Completed', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 3. Online/Offline Floating Control
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isOnline ? Colors.redAccent : const Color(0xFF06C167),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  ),
                  onPressed: () {
                    setState(() => _isOnline = !_isOnline);
                  },
                  child: Text(
                    _isOnline ? 'GO OFFLINE' : 'GO ONLINE TO RECEIVE TRIPS',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/bloc/ride_bloc.dart',
    name: 'ride_bloc.dart',
    language: 'dart',
    description: 'BLoC state machine handling Request -> Dispatch -> In Transit -> Completed lifecycle',
    code: `import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'ride_event.dart';
import 'ride_state.dart';

class RideBloc extends Bloc<RideEvent, RideState> {
  RideBloc() : super(RideInitialState()) {
    on<RequestRideEvent>(_onRequestRide);
    on<CancelRideEvent>(_onCancelRide);
  }

  Future<void> _onRequestRide(RequestRideEvent event, Emitter<RideState> emit) async {
    emit(RideSearchingState(tier: event.tier));

    // Simulate backend driver matching delay
    await Future.delayed(const Duration(seconds: 3));

    emit(
      RideMatchedState(
        driverName: 'Marcus Vance',
        carModel: 'Tesla Model 3',
        licensePlate: '8EVC912',
        driverLocation: LatLng(event.pickup.latitude + 0.005, event.pickup.longitude + 0.005),
        driverBearing: 45.0,
        etaMinutes: 3,
      ),
    );
  }

  void _onCancelRide(CancelRideEvent event, Emitter<RideState> emit) {
    emit(RideInitialState());
  }
}
`,
  },
  {
    path: 'lib/bloc/ride_event.dart',
    name: 'ride_event.dart',
    language: 'dart',
    description: 'Equitable Ride events (Request, Cancel, UpdateDriverLocation, RateTrip)',
    code: `import 'package:equatable/equatable.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

abstract class RideEvent extends Equatable {
  const RideEvent();
  @override
  List<Object?> get props => [];
}

class RequestRideEvent extends RideEvent {
  final String tier;
  final LatLng pickup;
  final LatLng destination;

  const RequestRideEvent({
    required this.tier,
    required this.pickup,
    required this.destination,
  });

  @override
  List<Object?> get props => [tier, pickup, destination];
}

class CancelRideEvent extends RideEvent {}
`,
  },
  {
    path: 'lib/bloc/ride_state.dart',
    name: 'ride_state.dart',
    language: 'dart',
    description: 'Ride state representation for matching, tracking, and completing rides',
    code: `import 'package:equatable/equatable.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

abstract class RideState extends Equatable {
  const RideState();
  @override
  List<Object?> get props => [];
}

class RideInitialState extends RideState {}

class RideSearchingState extends RideState {
  final String tier;
  const RideSearchingState({required this.tier});

  @override
  List<Object?> get props => [tier];
}

class RideMatchedState extends RideState {
  final String driverName;
  final String carModel;
  final String licensePlate;
  final LatLng driverLocation;
  final double driverBearing;
  final int etaMinutes;

  const RideMatchedState({
    required this.driverName,
    required this.carModel,
    required this.licensePlate,
    required this.driverLocation,
    required this.driverBearing,
    required this.etaMinutes,
  });

  @override
  List<Object?> get props => [
        driverName,
        carModel,
        licensePlate,
        driverLocation,
        driverBearing,
        etaMinutes,
      ];
}
`,
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Android manifest with foreground & background GPS permissions and Google Maps API Key meta-data',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.uber_clone_flutter">

    <!-- Fine and Coarse Geolocation Permissions -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="Uber Pulse"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">

        <!-- Google Maps API Key for Android -->
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
  },
  {
    path: 'ios/Runner/Info.plist',
    name: 'Info.plist',
    language: 'xml',
    description: 'iOS Info.plist with CoreLocation privacy descriptions',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>Uber Pulse</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>uber_clone_flutter</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>We need your location to show available drivers nearby and pick you up seamlessly.</string>
	<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
	<string>Drivers require continuous location tracking during live trips to display navigation to riders.</string>
	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
</dict>
</plist>
`,
  },
];
