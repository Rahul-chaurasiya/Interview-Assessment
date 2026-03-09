from app.database_mysql import get_db

try:
    with get_db() as cursor:
        cursor.execute('DESCRIBE interview_questions')
        columns = cursor.fetchall()
        print('Interview_questions table columns:')
        for col in columns:
            print(f'  {col["Field"]} - {col["Type"]}')
        
        print('\nChecking sample data:')
        cursor.execute('SELECT * FROM interview_questions LIMIT 3')
        questions = cursor.fetchall()
        for question in questions:
            print(f'  Keys: {list(question.keys())}')
            
except Exception as e:
    print(f'Error: {e}')
