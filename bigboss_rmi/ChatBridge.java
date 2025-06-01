package bigboss_rmi;

import java.rmi.Naming;
import java.util.Scanner;

public class ChatBridge {
    private static final String LOG_PREFIX = "[GYMBOT] ";

    public static void main(String[] args) {
        try {
            // Debug arguments
            System.out.printf("%s[DEBUG] Received %d argument(s)\n", LOG_PREFIX, args.length);
            if (args.length > 0) {
                System.out.printf("%s[DEBUG] Processing input: \"%s\"\n", LOG_PREFIX, String.join(" ", args));
            }

            // Connect to RMI server
            GymService gymService = (GymService) Naming.lookup("rmi://localhost:1099/GymService");

            // Get user input (from args or console)
            String input;
            if (args.length > 0) {
                input = String.join(" ", args);
            } else {
                try (Scanner scanner = new Scanner(System.in)) {
                    System.out.print(LOG_PREFIX + "[INPUT] Type your question: ");
                    input = scanner.nextLine();
                }
            }

            // Send to server
            System.out.printf("%s[QUERY] Sending to server: \"%s\"\n", LOG_PREFIX, input);
            String response = gymService.askQuestion(input);

            // Output reply for logs
            System.out.printf("%s[RESPONSE] %s\n", LOG_PREFIX, response);

            // ✅ Output formatted response for Node.js backend to detect
            System.out.println("CHATBOT_RESPONSE: " + response);

        } catch (Exception e) {
            System.err.printf("%s[ERROR] %s\n", LOG_PREFIX, e.getMessage());
            e.printStackTrace();
        }
    }
}
