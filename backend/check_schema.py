from app.database_mysql import get_db

try:
    with get_db() as cursor:
        cursor.execute('DESCRIBE interviews')
        columns = cursor.fetchall()
        print('Interviews table columns:')
        for col in columns:
            print(f'  {col["Field"]} - {col["Type"]}')
        
        print('\nChecking sample data:')
        cursor.execute('SELECT * FROM interviews LIMIT 3')
        interviews = cursor.fetchall()
        for interview in interviews:
            print(f'  ID: {interview["id"]}, Keys: {list(interview.keys())}')
            
except Exception as e:
    print(f'Error: {e}')
