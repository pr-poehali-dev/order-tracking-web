import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manages orders - create, list, and update order status
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with orders data or success message
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM orders ORDER BY created_at DESC")
            orders = cur.fetchall()
            cur.close()
            
            orders_list = []
            for order in orders:
                order_dict = dict(order)
                if order_dict['created_at']:
                    order_dict['created_at'] = order_dict['created_at'].isoformat()
                if order_dict['updated_at']:
                    order_dict['updated_at'] = order_dict['updated_at'].isoformat()
                orders_list.append(order_dict)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'orders': orders_list})
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO orders (first_name, last_name, phone, telegram, uid, status) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (body_data['first_name'], body_data.get('last_name'), body_data.get('phone'), body_data['telegram'], body_data['uid'], 'pending')
            )
            order_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'id': order_id, 'message': 'Order created'})
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            order_id = body_data.get('id')
            new_status = body_data.get('status')
            
            cur = conn.cursor()
            cur.execute(
                "UPDATE orders SET status = %s, updated_at = NOW() AT TIME ZONE 'Europe/Moscow' WHERE id = %s",
                (new_status, order_id)
            )
            conn.commit()
            cur.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'message': 'Order updated'})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        conn.close()
