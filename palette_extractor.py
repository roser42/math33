import sys

def main():
    srt = input('give me a palette\n')
    args = srt.split()
    
    print('[')
    for el in args:
        print(f'0x{el.upper()},')
    print('];')

if __name__ == '__main__':
    while True:
        main()
