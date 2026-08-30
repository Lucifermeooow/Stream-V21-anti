import 'package:flutter_test/flutter_test.dart';
import 'package:stream_v21/main.dart';

void main() {
  testWidgets('Stream V21 initial render test', (WidgetTester tester) async {
    await tester.pumpWidget(const StreamV21App());
    expect(find.text('Stream V21'), findsWidgets);
    expect(find.text('GO LIVE'), findsOneWidget);
  });
}
