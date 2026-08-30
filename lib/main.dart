import 'package:flutter/material.dart';
import 'screens/home_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StreamV21App());
}

class StreamV21App extends StatelessWidget {
  const StreamV21App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Stream V21',
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.red,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0D10),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          filled: true,
          fillColor: Color(0xFF15191E),
        ),
      ),
      home: const HomePage(),
    );
  }
}
