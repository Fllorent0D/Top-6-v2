The `configuration` is a constant object that stores configuration data for the application. It has three properties: `tabtBaseApi`, `top6`, and `email`.

- `tabtBaseApi` is a string that represents the base URL of the TabT API.
- `top6` is an object that stores configuration data specific to the top 6 ranking. It has two properties: `clubsPerTop` and `divisionsByLevel`.
    - `clubsPerTop` is an object that maps region names to lists of club unique indexes. The regions are represented by the `TOP_REGIONS` enum and the unique indexes are strings.
    - `divisionsByLevel` is an object that maps level names to lists of division IDs. The levels are represented by the `TOP_LEVEL` enum and the division IDs are numbers.
- `email` is an object that stores configuration data related to email notifications. It has three properties: `recipients`, `errorRecipients`, and `subject`.
    - `recipients` is a list of strings representing the email addresses of the recipients of the notifications.
    - `errorRecipients` is a list of strings representing the email addresses of the recipients of error notifications.
    - `subject` is a string representing the subject of the email notifications.
    - `text` is a string representing the text of the email notifications.
    - `output` is a string representing the output directory.